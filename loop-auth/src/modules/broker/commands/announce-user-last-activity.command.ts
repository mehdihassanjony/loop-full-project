import { UserLastActivityEventDto } from '../dtos/user-last-activity.dto';

export class AnnounceUserLastActivityCommand {
  constructor(public readonly body: UserLastActivityEventDto) {}
}
