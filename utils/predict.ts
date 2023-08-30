// Language: typescript
// Path: react-next\utils\predict.ts
import * as ImgUtils from './imageHelper';
import { runSqueezenetModel, runSuperResModel } from './modelHelper';

export async function inferenceSqueezenet(path: string): Promise<[any,number]> {
  // 1. Convert image to tensor
  const imageTensor = await ImgUtils.getImageTensorFromPath(path);
  // 2. Run model
  const [predictions, inferenceTime] = await runSqueezenetModel(imageTensor);
  // 3. Return predictions and the amount of time it took to inference.
  return [predictions, inferenceTime];
}

export async function inferenceSuperRes(path: string): Promise<[string, number]> {

  // 1. load the image  
  var image = await ImgUtils.loadImageFromPath(path);
  const width = image.bitmap.width
  const height = image.bitmap.height

  // 1. Convert RGB image to YCC
  const imageYCC = ImgUtils.imageRGBToYCC(image);

  // 2. Get image dims
  const dims = [1, 3, width, height];

  // 3. Resize image to 224x224
  const resizedInputImage = ImgUtils.resize(imageYCC);

  // 4. Convert image grayscale to tensor
  const grayscalearray = ImgUtils.getChannel(resizedInputImage, 0);
  const grayscalefloat32array = ImgUtils.convertImgToFloat(grayscalearray, [1, 1, 224, 224]);
  const grayscaleTensor = ImgUtils.convertArrayToTensor(grayscalefloat32array, [1, 1, 224, 224]);

  // 5. Run model
  const [predictions, inferenceTime] = await runSuperResModel(grayscaleTensor);
  const predictionsImage = ImgUtils.convertFloatToImg(predictions.data, [1, 1, 672, 672]);
  // 6. Convert YCC to RGB
  const resizedOutputImage = ImgUtils.resize(imageYCC, 672, 672);
  const upscaledImage = ImgUtils.replaceChannel(resizedOutputImage, 0, predictionsImage);
  // const upscaledImage = resizedOutputImage;
  const outputImage = ImgUtils.resize(upscaledImage, dims[2], dims[3]);
  // const outputImage = upscaledImage;
 
  const outputRGBImage = ImgUtils.imageYCCToRGB(outputImage);
  const processedImgSrc = await ImgUtils.getUrlFromImage(outputRGBImage);

  // 3. Return predictions and the amount of time it took to inference.
  return [processedImgSrc, inferenceTime];
}

