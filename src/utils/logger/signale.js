import { Signale } from 'signale';

const options = {
  types: {
    remind: {
      badge: '**',
      color: 'yellow',
      label: 'reminder',
      logLevel: 'info',
    },
    santa: {
      badge: '🎅',
      color: 'red',
      label: 'santa',
      logLevel: 'info',
    },
  },
};

const signale = new Signale (options);
signale.remind ('Improve Logging.');
signale.santa ('Hoho!');

export default signale;
