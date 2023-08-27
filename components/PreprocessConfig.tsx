// PreprocessorConfig.tsx

type ConfigData = {
  do_normalize?: boolean;
  image_mean?: number[];
  image_std?: number[];
  do_resize?: boolean;
  size?: number;
  do_center_crop?: boolean;
  crop_size?: number;
  do_flip_channels?: boolean;
  do_square?: boolean;
  do_pad?: boolean;
  pad_size?: number;
  do_rescale?: boolean;
  rescale_factor?: number;
  resize_longer?: boolean;
};

export type NormalizeConfig = {
  enabled: boolean;
  mean?: number[];
  std?: number[];
};

export class PreprocessorConfig {
  normalize: NormalizeConfig;
  resize: boolean;
  resizeLonger: boolean;
  size: number;
  centerCrop: boolean;
  cropSize: number;
  flipChannels: boolean;
  squareImage: boolean;
  pad: boolean;
  padSize: number;
  rescale: boolean;
  rescaleFactor: number;

  constructor() {
    this.normalize = {
      enabled: false,
      mean: undefined,
      std: undefined,
    };
    this.resize = false;
    this.resizeLonger = false;
    this.size = 0;
    this.centerCrop = false;
    this.cropSize = 0;
    this.flipChannels = false;
    this.squareImage = false;
    this.pad = false;
    this.padSize = 0;
    this.rescale = false;
    this.rescaleFactor = 1.0;
  }

  static fromFile = async (configPath: string): Promise<PreprocessorConfig> => {
    try {
      const resp = await fetch(configPath);
      if (!resp.ok) {
        throw new Error(`Failed to fetch config from ${configPath}`);
      }
      const configData: ConfigData = await resp.json();
      return this.parseConfig(configData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  static parseConfig = (configData: ConfigData): PreprocessorConfig => {
    const res = new PreprocessorConfig();
    res.normalize = {
      enabled: configData.do_normalize || false,
      mean: configData.image_mean,
      std: configData.image_std,
    };
    res.resize = configData.do_resize || false;
    res.size = configData.size || 0;
    res.centerCrop = configData.do_center_crop || false;
    res.cropSize = configData.crop_size || 0;
    res.flipChannels = configData.do_flip_channels || false;
    res.squareImage = configData.do_square || false;
    res.pad = configData.do_pad || false;
    res.padSize = configData.pad_size || 0;
    res.rescale = configData.do_rescale || false;
    res.rescaleFactor = configData.rescale_factor || 1.0;
    res.resizeLonger = configData.resize_longer || false;
    return res;
  };
}
