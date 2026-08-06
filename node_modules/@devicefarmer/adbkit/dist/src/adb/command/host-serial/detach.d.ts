import Command from '../../command';
import Bluebird from 'bluebird';
export default class DetachCommand extends Command<boolean> {
    execute(serial: string): Bluebird<boolean>;
}
//# sourceMappingURL=detach.d.ts.map