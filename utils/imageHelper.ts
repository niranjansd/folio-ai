import * as Jimp from 'jimp';
import { Tensor } from 'onnxruntime-web';

export async function getImageTensorFromPath(path: string, dims: number[] =  [1, 3, 224, 224]): Promise<Tensor> {
  // 1. load the image  
  var image = await loadImageFromPath(path);
  // 2. Resize image
  var resizedImage = resize(image, dims[2], dims[3], "bicubicInterpolation")
  // 3. convert to tensor
  var imageTensor = imageDataToTensor(image, dims);
  // 4. return the tensor
  return imageTensor;
};

export function resize(image: Jimp, width: number = 224, height: number = 224, mode: string = "bicubicInterpolation"): Jimp {
  return image.resize(width, height, mode);
};

export function resize_longer(image: Jimp, size: number, longer: boolean, mode: string = "bicubicInterpolation"): Jimp {
  if (longer) {
    if (image.bitmap.width > image.bitmap.height) {
      return image.resize(size, Jimp.AUTO, mode);
    } else {
      return image.resize(Jimp.AUTO, size, mode);
    }
  } else {
    if (image.bitmap.width < image.bitmap.height) {
      return image.resize(size, Jimp.AUTO, mode);
    } else {
      return image.resize(Jimp.AUTO, size, mode);
    }
  }
};

export async function loadImageFromPath(path: string): Promise<Jimp> {
  // Use Jimp to load the image and resize it.
  var imageData = await Jimp.default.read(path)
  return imageData;
};

export async function getUrlFromImage(img: Jimp): Promise<string> {
  // Use Jimp to load the image and resize it.
  const imgSrc = await img.getBase64Async('image/jpeg');
  return imgSrc;
};

export function getChannel(image: Jimp, channel: number): Array<number> {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;
  const channelArray = new Array<number>();
  
  // 2. Loop through the image buffer and extract the R, G, and B channels
  for (let i = 0; i < imageBufferData.length; i += 4) {
    channelArray.push(imageBufferData[i + channel]);
    // skip data[i + 3] to filter out the alpha channel
  }
  return channelArray;
};

export function replaceChannel(image: Jimp, channel: number, channelArray: Array<number>): Jimp {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;
  
  // 2. Create a new image with the same dimensions as the input image
  const outImage = new (Jimp as any)(image.bitmap.width, image.bitmap.height, 0x000000ff);

  // 3. round out value sto jimp values [0-255]
  for (let i = 0; i < imageBufferData.length; i += 4) {
    outImage.bitmap.data[i] = Math.round(imageBufferData[i]);
    outImage.bitmap.data[i + 1] = Math.round(imageBufferData[i+1]);
    outImage.bitmap.data[i + 2] = Math.round(imageBufferData[i+2]);
    outImage.bitmap.data[i + 3] = imageBufferData[i + 3];
    outImage.bitmap.data[i + channel] = channelArray[i/4];
  }

  return outImage;
};

export function transposeChannelDim(imageBufferData: Buffer): Array<number> {
  // 1. Get buffer data from image and create R, G, and B arrays.
  const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  // 2. Loop through the image buffer and extract the R, G, and B channels
  for (let i = 0; i < imageBufferData.length; i += 4) {
    redArray.push(imageBufferData[i]);
    greenArray.push(imageBufferData[i + 1]);
    blueArray.push(imageBufferData[i + 2]);
    // skip data[i + 3] to filter out the alpha channel
  }

  // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const transposedData = redArray.concat(greenArray).concat(blueArray);
  return transposedData;
};

export function convertImgToFloat(image: Array<number>, dims: number[]): Float32Array {
  // 4. convert to float32
  let i, l = image.length; // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
  for (i = 0; i < l; i++) {
    float32Data[i] = image[i] / 255.0; // convert to float
  }
  return float32Data;
};

export function scaleImgToFloat(image: Array<number>, dims: number[], scale: number = 1./255.): Float32Array {
  // 4. convert to float32
  let i, l = image.length; // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
  for (i = 0; i < l; i++) {
    float32Data[i] = image[i] * scale; // convert to float
  }
  return float32Data;
};

export function convertFloatToImg(float32Data: Float32Array, dims: number[]): Array<number> {
  // 4. convert to float32
  let i, l = float32Data.length; // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const ImgData = new Array<number>();
  for (i = 0; i < l; i++) {
    ImgData.push(Math.min(255, Math.max(0, Math.round(float32Data[i] * 255.0)))); // convert to float
  }
  return ImgData;
};

export function convertArrayToTensor(float32image: Float32Array, dims: number[]): Tensor {
  // 4. convert to float32
  const inputTensor = new Tensor("float32", float32image, dims);
  return inputTensor;
};

export function imageDataToTensor(image: Jimp, dims: number[]): Tensor {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;

  // 2. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const transposedData = transposeChannelDim(imageBufferData);

  // 3. convert to float32
  const float32Data = convertImgToFloat(transposedData, dims);

  // 4. create the tensor object from onnxruntime-web.
  const inputTensor = convertArrayToTensor(float32Data, dims);
  return inputTensor;
};

export function imageRGBToYCC(image: Jimp): Jimp {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;
  const width = image.bitmap.width
  const height = image.bitmap.height

  // 2. Concatenate YCC to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const outImage = new (Jimp as any)(width, height, 0x000000ff); // create a new image with the same dimensions as the input image
  // 3. round out value sto jimp values [0-255]
  for (let i = 0; i < imageBufferData.length; i+=4) {
    var red = imageBufferData[i];
    var green = imageBufferData[i + 1];
    var blue = imageBufferData[i + 2];
    outImage.bitmap.data[i] = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
    outImage.bitmap.data[i + 1] = Math.round(128 - 0.168736 * red - 0.331264 * green + 0.5 * blue);
    outImage.bitmap.data[i + 2] = Math.round(128 + 0.5 * red - 0.418688 * green - 0.081312 * blue);
    outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
  }
  // 4. return the image
  return outImage;
};


export function imageYCCToRGB(image: Jimp): Jimp {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;

  const width = image.bitmap.width
  const height = image.bitmap.height
  // 2. Concatenate YCC to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const outImage = new (Jimp as any)(width, height, 0x000000ff); // create a new image with the same dimensions as the input image
  var y = imageBufferData[0];
  var cb = imageBufferData[1];
  var cr = imageBufferData[2];

  // 3. round out value sto jimp values [0-255]
  for (let i = 0; i < imageBufferData.length; i+=4) {
    y = imageBufferData[i];
    cb = imageBufferData[i + 1];
    cr = imageBufferData[i + 2];
    outImage.bitmap.data[i] = Math.round(y + 1.402 * (cr - 128));
    outImage.bitmap.data[i + 1] = Math.round(y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128));
    outImage.bitmap.data[i + 2] = Math.round(y + 1.772 * (cb - 128));
    outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
  }
  // 4. return the image
  return outImage;
};

export function crop(image: Jimp, croppedwidth: number, croppedheight: number): Jimp {
  const startX = (image.bitmap.width - croppedwidth) / 2;
  const startY = (image.bitmap.height - croppedheight) / 2;
  image = image.crop(
    startX, startY,
    croppedwidth, croppedheight
  );
  return image;
};

export function pad(image: Jimp, padSize: number): Jimp {
  // Get dimensions of the original image
  const width = image.getWidth();
  const height = image.getHeight();

  const startX = (padSize - image.bitmap.width) / 2;
  const startY = (padSize - image.bitmap.height) / 2;

  // Create a new blank image with the padded dimensions
  const paddedImage = new (Jimp as any)(padSize, padSize, 0xFFFFFFFF)
  // Place the original image into the padded image
  paddedImage.composite(image, startX, startY);
  return paddedImage;
};

export function padToSquare(image: Jimp): Jimp {
  const padSize = Math.max(image.bitmap.width, image.bitmap.height);
  const paddedimage = pad(image, padSize);
  return paddedimage;
};

export function normalize(image: Jimp, mean: number[], std: number[]): Float32Array {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;
  const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  // 2. Loop through the image buffer and extract the R, G, and B channels
  const float32Data = new Float32Array(imageBufferData.length);
  for (let i = 0; i < imageBufferData.length; i += 4) {
    float32Data[i] = (imageBufferData[i] - mean[0]) / std[0];
    float32Data[i] = (imageBufferData[i + 1] - mean[1]) / std[1];
    float32Data[i] = (imageBufferData[i + 2] - mean[2]) / std[2];
    // skip data[i + 3] to filter out the alpha channel
  }
  return float32Data;
};


