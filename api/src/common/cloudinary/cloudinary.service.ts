import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File, folder: string) {
    try {
      // ✅ Convert buffer to base64
      const base64 = file.buffer.toString('base64');

      const dataURI = `data:${file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder,
        resource_type: 'image',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
    //   throw new Error('Cloudinary upload failed');
      throw error;
    }
  }
}