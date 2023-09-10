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
  image: string | ArrayBuffer | null;
  points: Point[] | null;
  boxes: Point[][] | null;
};

export async function loadSAM(image: Jimp): Promise<[Session, Session]> {
  // Create session and set options. See the docs here for more options:
// https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.SessionOptions.html#graphOptimizationLevel

const start = new Date();
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
return [encodersession, decodersession];
};

export async function loadEmbedding(encodersession: Session, image: Jimp): Promise<Array<number>> {
  // Create session and set options. See the docs here for more options:
// https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.SessionOptions.html#graphOptimizationLevel

const processed_image = runSAMPreprocess(image);

// convert image to tensor
const imageTensor = await ImgUtils.convertArrayToTensor(processed_image, [1, 3, 1024, 1024]);

// create feeds with the input name from model export and the preprocessed data.
const encoderResult = await processSAMEncoder(encodersession, imageTensor);
const embedding = Array.from(encoderResult.data as Float32Array);
return embedding;
};

export function runSAMPreprocess(image: Jimp): Float32Array {
    // resize image to 1024 longer side
    image = ImgUtils.resize_longer(image, 1024, true);
    const newWidth = image.bitmap.width;
    const newHeight = image.bitmap.height;
    // pad to 1024x1024 aligned top left
    image = ImgUtils.pad(image, 1024);
    // transpose image and normalize each channel separately
    const transposedimage = ImgUtils.normalizeAndTranspose(image, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);
  return transposedimage;
};

export async function runSAM(
  decodersession: Session,
  image: Jimp,
  embedding: Array<number>,
  input: SegmentAnythingPrompt,
    ): Promise<[Array<number>, Array<number>, Array<number>]> {

    // original image dims
    const originalWidth = image.bitmap.width;
    const originalHeight = image.bitmap.height;
    // create feeds with the input name from model export and the preprocessed data.
    const encoderResult = ImgUtils.convertArrayToTensor(new Float32Array(embedding), [1, 256, 64, 64]);
    const decoderOutput = await processSAMDecoder(decodersession, encoderResult,
        [originalWidth, originalHeight], input.points, input.boxes
        );

    const size = decoderOutput.dims[2] * decoderOutput.dims[3] * 4;
    const arrayBuffer = new ArrayBuffer(size);
    const height = decoderOutput.dims[2];
    const width = decoderOutput.dims[3];
    const mask = new Array<number>();
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
    const color = [230, 100, 100, 255];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (decoderOutput.data[y * width + x] > 0) {
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
          mask.push(1);
        } else {
          mask.push(0);
        }
      }
    }
    return [embedding, mask, [topLeft.x, topLeft.y, bottomRight.x, bottomRight.y]];
  };

export async function processSAMEncoder(session: Session, imageTensor: ort.Tensor): Promise<any> {
    const feeds: Record<string, ort.Tensor> = {};
    feeds["x"] = imageTensor;
    const outputData = await session.run(feeds);
    const outputNames = await session.outputNames();
    const output = outputData[outputNames[0]];
    return output;
};

export async function processSAMDecoder(session: Session, embedding: any, originalDims: number[],
                                        points: Point[] | null, boxes: Point[][] | null): Promise<any> {
    if (points === undefined && boxes === undefined) {
      throw Error("you must provide at least one point or box");
    }
    const onnx_coord: number[] = [];
    const onnx_label: number[] = [];
    // choose the smaller scale
    const scalex = 1024 / originalDims[0];
    const scaley = 1024 / originalDims[1];
    let scale;
    if (scalex < scaley) {
      scale = scalex;
    } else {
      scale = scaley;
    };

    if (points !== null) {
      for (const point of points) {
        onnx_coord.push(point.x * scale);
        onnx_coord.push(point.y * scale);
        onnx_label.push(point.positive ? 1 : 0);
      }
    }
    if (boxes !== null) {
      for (const box of boxes) {
        onnx_coord.push(box[0].x * scalex);
        onnx_coord.push(box[0].y * scaley);
        onnx_label.push(2);
        onnx_coord.push(box[1].x * scalex);
        onnx_coord.push(box[1].y * scaley);
        onnx_label.push(3);
      }
    } else {
      onnx_coord.push(0);
      onnx_coord.push(0);
      onnx_label.push(-1);
    }
    // console.log('onnx_coord: ', onnx_coord);
    // console.log('onnx_label: ', onnx_label);
    // console.log('embedding: ', embedding.dims);
    const feeds: Record<string, ort.Tensor> = {};
    feeds["image_embeddings"] = embedding;
    feeds["mask_input"] = new ort.Tensor(
      new Float32Array(256 * 256).fill(1),
      [1, 1, 256, 256]
    );
    feeds["has_mask_input"] = new ort.Tensor(new Float32Array(1).fill(0), [1]);
    feeds["orig_im_size"] = new ort.Tensor(
      new Float32Array([originalDims[1], originalDims[0]]), [2]);
    feeds["point_coords"] = new ort.Tensor(new Float32Array(onnx_coord), [
      1, onnx_coord.length / 2, 2,]);
    feeds["point_labels"] = new ort.Tensor(new Float32Array(onnx_label), [
      1, onnx_label.length,]);
    // console.log('feeds: ', feeds);
    const outputData = await session.run(feeds);
    // console.log(outputData)
    return outputData["masks"];
  };

export function  createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
  };


