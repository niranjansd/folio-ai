export const models = [
    {
    id: "mobilevit-xxsmall",
    title: "MobileViT extra extra small",
    description: "",
    memEstimateMB: 40,
    // type: ModelType.Classification,
    sizeMB: 5,
    modelPaths: ([
      [
        "model",
        "https://web-ai-models.org/image/classification/mobilevit-xx-small/model.onnx.gz",
      ],
    ]),
    configPath:
      "https://web-ai-models.org/image/classification/mobilevit-xx-small/config.json",
    preprocessorPath:
      "https://web-ai-models.org/image/classification/mobilevit-xx-small/preprocessor_config.json",
    // examples: classificationExamples,
    tags: ["classification", "mobilevit"],
    referenceURL: "https://huggingface.co/apple/mobilevit-xx-small",
  }];