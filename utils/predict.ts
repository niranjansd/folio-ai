// Language: typescript
// Path: react-next\utils\predict.ts
import * as ImgUtils from './imageHelper';
import { runSqueezenetModel, runSuperResModel } from './modelHelper';
import { runSAM, SegmentAnythingPrompt, Point, loadEmbedding, loadSAM } from './sam';
import { Session }  from './session';

export async function inferenceSAM(slidercontext: any,
                                   decodersession: Session | null,
                                   encodersession: Session | null): Promise<[Array<number>, Array<number>, Array<number>]> {

  // 1. Get inputs
  const path = slidercontext.sliderRef;
  var inputembedding = slidercontext.embeddings;  

  // 2. Convert image to tensor
  const image = await ImgUtils.loadImageFromPath(path);
  if (!decodersession) {
    let encodersession: Session;
    [encodersession, decodersession] = await loadSAM(image);
  }
  if (!inputembedding) {
    if (!encodersession) {
      let encodersession: Session;
      [encodersession, decodersession] = await loadSAM(image);
      inputembedding = await loadEmbedding(encodersession, image);
    } else {
      inputembedding = await loadEmbedding(encodersession, image);
    }
  }

  const points = slidercontext.points;
  let prompt: SegmentAnythingPrompt = {image: null, points: null, boxes: null};
  let point_inputs: Array<{ x: number, y: number, positive: boolean }> = [];
  if (points.length > 0) {
    for (const point of points) {
      point_inputs.push({ x: point[0], y: point[1], positive: true });
    }
    prompt.points = point_inputs;
  }
  // 3. Run model
  const [embedding, mask, maskBounds] = await runSAM(decodersession, image, inputembedding, prompt);
  return [embedding, mask, maskBounds];
}

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
  const predictionsImage = ImgUtils.convertFloatToInt8(predictions.data);
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

