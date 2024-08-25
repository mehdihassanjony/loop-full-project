import { IsString } from 'class-validator';

export class UserLastActivityEventDto {
  @IsString()
  userId: string;
}
