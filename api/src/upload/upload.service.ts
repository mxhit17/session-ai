import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';


@Injectable()
export class UploadService {
  constructor(private cloudinary: CloudinaryService) {}

  async upload(file: Express.Multer.File, type: string) {
    if (!file) throw new BadRequestException('File is required');

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only images allowed');
    }

    // 👇 dynamic folder based on type
    let folder = 'misc';

    if (type === 'speaker') folder = 'speakers';
    else if (type === 'event') folder = 'events';
    else if (type === 'session') folder = 'sessions';

    const result = await this.cloudinary.uploadImage(file, folder);

    return {
      url: result.url,
      publicId: result.publicId,
    };
  }
}