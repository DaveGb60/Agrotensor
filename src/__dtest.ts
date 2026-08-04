import { Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';
export class T extends Model {
  static table = 't';
  @text('title') declare title: string;
}
