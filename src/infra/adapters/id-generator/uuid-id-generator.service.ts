import { v4 as uuidv4 } from 'uuid';

import { IdGeneratorPort } from '@/core/application/ports/id-generator.port';

export class UuidGenerator implements IdGeneratorPort {
  generate(): string {
    return uuidv4();
  }
}
