
import config from '../config';

const socket = io(config.ws);

export default socket;
