import { UserLoginEventDto } from '../dtos/user-login-event.dto';

export class AnnounceUserLoginCommand {
  constructor(public readonly body: UserLoginEventDto) {}
}
