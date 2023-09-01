import * as Jimp from 'jimp';
import { Tensor } from 'onnxruntime-web';

export async function getImageTensorFromPath(path: string, dims: number[] =  [1, 3, 224, 224]): Promise<Tensor> {
  // 1. load the image  
  var image = await loadImageFromPath(path);
  // 2. Resize image
  var resizedImage = resize(image, dims[2], dims[3])
  // 3. convert to tensor
  var imageTensor = imageDataToTensor(image, dims);
  // 4. return the tensor
  return imageTensor;
};

export function resize(image: Jimp, width: number = 224, height: number = 224): Jimp {
  return image.resize(width, height);
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
  
  // // 1. Get buffer data from image and create R, G, and B arrays.
  // const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  // // 2. Loop through the image buffer and extract the R, G, and B channels
  // for (let i = 0; i < imageBufferData.length; i += 4) {
  //   redArray.push(imageBufferData[i]);
  //   greenArray.push(imageBufferData[i + 1]);
  //   blueArray.push(imageBufferData[i + 2]);
  //   // skip data[i + 3] to filter out the alpha channel
  // }

  // 3. Create a new image with the same dimensions as the input image
  const outImage = new (Jimp as any)(image.bitmap.width, image.bitmap.height, 0x000000ff);

  // 4. round out value sto jimp values [0-255]
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

function imageDataToTensor(image: Jimp, dims: number[]): Tensor {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;

  // const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  // // 2. Loop through the image buffer and extract the R, G, and B channels
  // for (let i = 0; i < imageBufferData.length; i += 4) {
  //   redArray.push(imageBufferData[i]);
  //   greenArray.push(imageBufferData[i + 1]);
  //   blueArray.push(imageBufferData[i + 2]);
  //   // skip data[i + 3] to filter out the alpha channel
  // }

  // // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  // const transposedData = redArray.concat(greenArray).concat(blueArray);
  const transposedData = transposeChannelDim(imageBufferData);

  // 4. convert to float32
  // let i, l = transposedData.length; // length, we need this for the loop
  // // create the Float32Array size 3 * 224 * 224 for these dimensions output
  // const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
  // for (i = 0; i < l; i++) {
  //   float32Data[i] = transposedData[i] / 255.0; // convert to float
  // }
  const float32Data = convertImgToFloat(transposedData, dims);

  // 5. create the tensor object from onnxruntime-web.
  // const inputTensor = new Tensor("float32", float32Data, dims);
  const inputTensor = convertArrayToTensor(float32Data, dims);
  return inputTensor;
};

export function imageRGBToYCC(image: Jimp): Jimp {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;
  const width = image.bitmap.width
  const height = image.bitmap.height
  // const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  // // 2. Loop through the image buffer and extract the R, G, and B channels
  // for (let i = 0; i < imageBufferData.length; i += 4) {
  //   redArray.push(imageBufferData[i]);
  //   greenArray.push(imageBufferData[i + 1]);
  //   blueArray.push(imageBufferData[i + 2]);
  //   // skip data[i + 3] to filter out the alpha channel
  // } 
  // // return image
  // // 3. Perform the YCC conversion
  // const y = 0.299 * redArray + 0.587 * greenArray + 0.114 * blueArray;
  // const cb = 128 - 0.168736 * redArray - 0.331264 * greenArray + 0.5 * blueArray;
  // const cr = 128 + 0.5 * redArray - 0.418688 * greenArray - 0.081312 * blueArray;

  // 4. Concatenate YCC to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  // const transposedData = y.concat(cb).concat(cr);
  const outImage = new (Jimp as any)(width, height, 0x000000ff); // create a new image with the same dimensions as the input image
  // 5. round out value sto jimp values [0-255]
  for (let i = 0; i < imageBufferData.length; i+=4) {
    // outImage.bitmap.data[i] = Math.round(y[i]);
    // outImage.bitmap.data[i + 1] = Math.round(cb[i]);
    // outImage.bitmap.data[i + 2] = Math.round(cr[i]);
    // outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
    var red = imageBufferData[i];
    var green = imageBufferData[i + 1];
    var blue = imageBufferData[i + 2];
    outImage.bitmap.data[i] = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
    outImage.bitmap.data[i + 1] = Math.round(128 - 0.168736 * red - 0.331264 * green + 0.5 * blue);
    outImage.bitmap.data[i + 2] = Math.round(128 + 0.5 * red - 0.418688 * green - 0.081312 * blue);
    outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
  }
  // 6. return the image
  return outImage;
};


export function imageYCCToRGB(image: Jimp): Jimp {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;
  // const [y, cb, cr] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  const width = image.bitmap.width
  const height = image.bitmap.height
  // // 2. Loop through the image buffer and extract the R, G, and B channels
  // for (let i = 0; i < imageBufferData.length; i += 4) {
  //   y.push(imageBufferData[i]);
  //   cb.push(imageBufferData[i + 1]);
  //   cr.push(imageBufferData[i + 2]);
  //   // skip data[i + 3] to filter out the alpha channel
  // } 
  // // return image;

  // // 3. Perform the RGB conversion
  // const redArray = y + 1.402 * (cr - 128);
  // const greenArray = y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128);
  // const blueArray = y + 1.772 * (cb - 128);

  // 4. Concatenate YCC to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  // const transposedData = y.concat(cb).concat(cr);
  const outImage = new (Jimp as any)(width, height, 0x000000ff); // create a new image with the same dimensions as the input image
  var y = imageBufferData[0];
  var cb = imageBufferData[1];
  var cr = imageBufferData[2];
// 5. round out value sto jimp values [0-255]
  for (let i = 0; i < imageBufferData.length; i+=4) {
    // outImage.bitmap.data[i] = Math.round(y[i]);
    // outImage.bitmap.data[i + 1] = Math.round(cb[i]);
    // outImage.bitmap.data[i + 2] = Math.round(cr[i]);
    // outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
    y = imageBufferData[i];
    cb = imageBufferData[i + 1];
    cr = imageBufferData[i + 2];
    outImage.bitmap.data[i] = Math.round(y + 1.402 * (cr - 128));
    outImage.bitmap.data[i + 1] = Math.round(y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128));
    outImage.bitmap.data[i + 2] = Math.round(y + 1.772 * (cb - 128));
    outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
  }
  // 6. return the image
  return outImage;
  // // 4. Concatenate YCC to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  // // const transposedData = y.concat(cb).concat(cr);
  // outImage = new Jimp(dims[2], dims[3], 0x000000ff); // create a new image with the same dimensions as the input image
  // // 5. round out value sto jimp values [0-255]
  // for (let i = 0; i < y.length; i++) {
  //   outImage.bitmap.data[i] = Math.round(redArray);
  //   outImage.bitmap.data[i + 1] = Math.round(greenArray);
  //   outImage.bitmap.data[i + 2] = Math.round(blueArray);
  //   outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
  // }
  // // 6. return the image
  // return outImage;
};



