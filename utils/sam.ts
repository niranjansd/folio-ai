import * as ort from 'onnxruntime-web';
import Jimp from "jimp";
import * as ImgUtils from './imageHelper';
import { Session }  from './session';

export interface Point {
  x: number;
  y: number;
  positive: boolean;
}

export type SAMResult = {
    canvas: HTMLCanvasElement; // | OffscreenCanvas;
    elapsed: number;
    topLeft: Point;
    bottomRight: Point;
};

export type SegmentAnythingPrompt = {
  image: string | ArrayBuffer | undefined;
  points: Point[] | undefined;
  boxes: Point[][] | undefined;
};

export async function runSAM(image: Jimp, input: SegmentAnythingPrompt | null = null
  ): Promise<[any, number]> {
      // Create session and set options. See the docs here for more options:
    // https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.SessionOptions.html#graphOptimizationLevel
  
  const encodersession = new Session({
    numThreads: 1,
    executionProviders: ["wasm"],
    memoryLimitMB: 10000,
    cacheSizeMB: 1000000,
  });
  const encoderpath = "./_next/static/chunks/pages/sam-encoder-quant.onnx";
  await encodersession.init(encoderpath);
  const decodersession = new Session({
    numThreads: 1,  
    executionProviders: ["wasm"],
    memoryLimitMB: 10000,
    cacheSizeMB: 1000000,
  });
  const decoderpath = "./_next/static/chunks/pages/sam-decoder-quant.onnx";
  await decodersession.init(decoderpath);

  console.log("Inference session created");
  // Run inference and get results.
  const results = await runSAMInference(encodersession, decodersession, image, input);
  return [results.canvas, results.elapsed];
}

async function runSAMInference(
  encodersession: Session,
  decodersession: Session,
  image: Jimp,
    input: SegmentAnythingPrompt | null,
    ): Promise<SAMResult> {
    // Get start time to calculate inference time.
    const start = new Date();
    // create feeds with the input name from model export and the preprocessed data.
    const encoderResult = await processSAMEncoder(encodersession, image);
    const originalWidth = image.bitmap.width;
    const originalHeight = image.bitmap.height;
    const decoderOutput = await processSAMDecoder(decodersession, encoderResult,
        [originalWidth, originalHeight], [1024, 1024], null, null//input.points, input.boxes
        );

    const size = decoderOutput.dims[2] * decoderOutput.dims[3] * 4;
    const arrayBuffer = new ArrayBuffer(size);
    const pixels = new Uint8ClampedArray(arrayBuffer);
    const color = [237, 61, 26];
    const topLeft: Point = {
      x: Infinity,
      y: Infinity,
      positive: false,
    };
    const bottomRight: Point = {
      x: 0,
      y: 0,
      positive: false,
    };
    for (let y = 0; y < decoderOutput.dims[2]; y++) {
      for (let x = 0; x < decoderOutput.dims[3]; x++) {
        const value = decoderOutput.data[y * decoderOutput.dims[3] + x];
        if ((value as number) > 0) {
          const idx = (y * decoderOutput.dims[3] + x) * 4;
          pixels[idx] = color[0];
          pixels[idx + 1] = color[1];
          pixels[idx + 2] = color[2];
          pixels[idx + 3] = 255;
          if (x < topLeft.x) {
            topLeft.x = x;
          }
          if (y < topLeft.y) {
            topLeft.y = y;
          }
          if (x > bottomRight.x) {
            bottomRight.x = x;
          }
          if (y > bottomRight.y) {
            bottomRight.y = y;
          }
        } else {
          pixels[y] = 0;
          pixels[y + 1] = 0;
          pixels[y + 2] = 0;
          pixels[y + 3] = 0;
        }
      }
    }
    const imageData = new ImageData(
      pixels,
      decoderOutput.dims[3],
      decoderOutput.dims[2]
    );
    const resCanvas = createCanvas(imageData.width, imageData.height);
    const ctx = resCanvas.getContext("2d");
    if (
      // ctx instanceof OffscreenCanvasRenderingContext2D ||
      ctx instanceof CanvasRenderingContext2D
    ) {
      ctx.putImageData(imageData, 0, 0);
    } else {
      throw new Error("Invalid rendering context");
    }
    const end = new Date();
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    const result: SAMResult = {
      canvas: resCanvas,
      elapsed: elapsed,
      topLeft: topLeft,
      bottomRight: bottomRight,
    };
    return result;
  };

export async function processSAMEncoder(session: Session, image: Jimp): Promise<any> {
    const originalWidth = image.bitmap.width;
    const originalHeight = image.bitmap.height;

    image = ImgUtils.resize_longer(image, 1024, true);
    image = ImgUtils.pad(image, 1024);
    const floatimage = ImgUtils.normalize(image, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);

    const imageTensor = await ImgUtils.convertArrayToTensor(floatimage, [1, 3, 1024, 1024]);

    const feeds: Record<string, ort.Tensor> = {};
    feeds["x"] = imageTensor;
    const outputData = await session.run(feeds);
    const outputNames = await session.outputNames();
    const output = outputData[outputNames[0]];

    return output;
};

export async function processSAMDecoder(session: Session, result: any, originalDims: number[], newDims: number[],
                                        points: Point[] | null, boxes: Point[][] | null): Promise<ort.Tensor> {
    if (points === undefined && boxes === undefined) {
      throw Error("you must provide at least one point or box");
    }
    const onnx_coord: number[] = [];
    const onnx_label: number[] = [];
    if (points !== null) {
      for (const point of points) {
        onnx_coord.push((point.x / originalDims[0]) * newDims[0]);
        onnx_coord.push((point.y / originalDims[1]) * newDims[1]);
        onnx_label.push(point.positive ? 1 : 0);
      }
    }
    if (boxes !== null) {
      for (const box of boxes) {
        onnx_coord.push((box[0].x / originalDims[0]) * newDims[0]);
        onnx_coord.push((box[0].y / originalDims[1]) * newDims[1]);
        onnx_label.push(2);
        onnx_coord.push((box[1].x / originalDims[0]) * newDims[0]);
        onnx_coord.push((box[1].y / originalDims[1]) * newDims[1]);
        onnx_label.push(3);
      }
    } else {
      onnx_coord.push(0);
      onnx_coord.push(0);
      onnx_label.push(-1);
    }
    const feeds: Record<string, ort.Tensor> = {};
    feeds["image_embeddings"] = result;
    feeds["mask_input"] = new ort.Tensor(
      new Float32Array(256 * 256).fill(1),
      [1, 1, 256, 256]
    );
    feeds["has_mask_input"] = new ort.Tensor(new Float32Array(1).fill(0), [1]);
    feeds["orig_im_size"] = new ort.Tensor(
      new Float32Array([originalDims[0], originalDims[1]]), [2]);
    feeds["point_coords"] = new ort.Tensor(new Float32Array(onnx_coord), [
      1, onnx_coord.length / 2, 2,]);
    feeds["point_labels"] = new ort.Tensor(new Float32Array(onnx_label), [
      1, onnx_label.length,]);

    const outputData = await session.run(feeds);
    return outputData["masks"];
  };

export function  createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
  };


