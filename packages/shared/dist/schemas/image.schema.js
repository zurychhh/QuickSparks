"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageFormat = exports.imageConvertResponseSchema = void 0;
exports.imageConvertResponseSchema = {
    type: 'object',
    properties: {
        url: { type: 'string' },
        fileName: { type: 'string' },
        width: { type: 'number' },
        format: { type: 'string' },
        message: { type: 'string' }
    },
    required: ['url', 'fileName', 'width', 'format', 'message'],
    additionalProperties: false
};
// Image format enum
var ImageFormat;
(function (ImageFormat) {
    ImageFormat["JPEG"] = "jpeg";
    ImageFormat["PNG"] = "png";
    ImageFormat["WEBP"] = "webp";
    ImageFormat["AVIF"] = "avif";
})(ImageFormat || (exports.ImageFormat = ImageFormat = {}));
