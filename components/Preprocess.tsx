import Jimp from "jimp";
import { PreprocessorConfig, NormalizeConfig } from "./PreprocessConfig";
import * as ort from "onnxruntime-common";
import { Buffer } from 'buffer';

export interface PreprocessorResult {
  tensor: ort.Tensor;
  newWidth: number;
  newHeight: number;
}

export class Preprocessor {
  config: PreprocessorConfig;

  constructor(config: PreprocessorConfig) {
    this.config = config;
  }

  process = (image: Jimp): PreprocessorResult => {
    if (this.config.resize) {
      if (!this.config.squareImage) {
        if (
          image.bitmap.width > image.bitmap.height &&
          this.config.resizeLonger
        ) {
          image = image.resize(this.config.size, Jimp.AUTO, Jimp.RESIZE_BICUBIC);
        } else {
          image = image.resize(Jimp.AUTO, this.config.size, Jimp.RESIZE_BICUBIC);
        }
      } else {
        image = image.resize(
          this.config.size,
          this.config.size,
          Jimp.RESIZE_BICUBIC
        );
      }
    }
    const newWidth = image.bitmap.width;
    const newHeight = image.bitmap.height;
  
    if (this.config.centerCrop) {
      const startX = (image.bitmap.width - this.config.cropSize) / 2;
      const startY = (image.bitmap.height - this.config.cropSize) / 2;
      image = image.crop(
        startX,
        startY,
        this.config.cropSize,
        this.config.cropSize
      );
    }
  
    const tensor = this.imageDataToTensor(image);
    
    return {
      tensor: tensor,
      newWidth: newWidth,
      newHeight: newHeight,
    };
  };
  
  imageDataToTensor = (image: Jimp): ort.Tensor => {
    const redArray: number[] = [];
    const greenArray: number[] = [];
    const blueArray: number[] = [];    
    const width = this.config.pad ? this.config.padSize : image.bitmap.width;
    const height = this.config.pad ? this.config.padSize : image.bitmap.height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x >= image.bitmap.width || y >= image.bitmap.height) {
          redArray.push(0.0);
          greenArray.push(0.0);
          blueArray.push(0.0);
          continue;
        }
        const color = image.getPixelColor(x, y);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const rgba = Jimp.intToRGBA(color);
        let value = this.getValue(rgba.r, 0);
        redArray.push(value);
        value = this.getValue(rgba.g, 1);
        greenArray.push(value);
        value = this.getValue(rgba.b, 2);
        blueArray.push(value);
      }
    }
    let transposedData: number[] = [];
    if (this.config.flipChannels) {
      transposedData = blueArray.concat(greenArray).concat(redArray);
    } else {
      transposedData = redArray.concat(greenArray).concat(blueArray);
    }
    const float32Data = new Float32Array(transposedData);
    const dims = [1, 3, height, width];
    const inputTensor = new ort.Tensor("float32", float32Data, dims);
    return inputTensor;
  };

  getValue = (value: number, colorIdx: number): number => {
    if (
      this.config.normalize.enabled &&
      this.config.normalize.mean &&
      this.config.normalize.std
    ) {
      value =
        (value / 255.0 - this.config.normalize.mean[colorIdx]) /
        this.config.normalize.std[colorIdx];
    } else {
      if (this.config.rescale) {
        value = value * this.config.rescaleFactor;
      } else {
        value = value / 255.0;
      }
    }
    return value;
  };
}

export const prepareImagesTensor = async (
  // inputs: string[] | ArrayBuffer[],
  inputs: string[],
  preprocessor?: Preprocessor
): Promise<ort.Tensor> => {
  if (!preprocessor) {
    throw new Error("The model is not initialized");
  }
  const tensors: ort.Tensor[] = new Array(inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    let image: Jimp;
    image = await Jimp.read(inputs[i]);
    // if (typeof inputs[i] === "string") {
    //   image = await Jimp.read(inputs[i]);
    // } else if (inputs[i] instanceof ArrayBuffer) {
    //   const buffer = Buffer.from(inputs[i]);
    //   image = await Jimp.read(buffer);
    // } else {
    //   throw new Error("Unsupported input type");
    // }
    tensors[i] = preprocessor.process(image).tensor;
  }
  const resultData = new Float32Array(tensors.length * tensors[0].data.length);
  for (let i = 0; i < tensors.length; i++) {
    for (let j = 0; j < tensors[0].data.length; j++) {
      resultData[i * tensors[0].data.length + j] = tensors[i].data[j] as number;
    }
  }
  return new ort.Tensor("float32", resultData, [
    tensors.length,
    tensors[0].dims[1],
    tensors[0].dims[2],
    tensors[0].dims[3],
  ]);
};
