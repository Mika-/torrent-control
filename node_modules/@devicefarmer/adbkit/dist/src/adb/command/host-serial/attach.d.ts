import Command from '../../command';
import Bluebird from 'bluebird';
export default class AttachCommand extends Command<boolean> {
    execute(serial: string): Bluebird<boolean>;
}
//# sourceMappingURL=attach.d.ts.map