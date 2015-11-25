import async = require('async');
const debug = require('debug')('bucketr');

export interface State<T> {
  paths: string[];
  test: (data: T, callback: (err: Error, result?: boolean) => void) => void;
};

export class Bucketr<T> {
  states: {[key: string]: State<T>};
  defaultState: string;

  constructor(input: {states: {[key: string]: State<T>}, defaultState: string}) {
    this.states = input.states;
    this.defaultState = input.defaultState;
  };

  run(data: T, currentStateName: string, cb: (err: Error, nextStateName?: string) => void): void {
    var self = this;

    if (!currentStateName) {
      currentStateName = this.defaultState
    }

    const currentState: State<T> = this.states[currentStateName];

    async.eachSeries<string>(currentState.paths, function(nextStateName, next) {
      const nextState: State<T> = self.states[nextStateName];

      // skip if this state doesn't exist
      if (!nextState) return next(null);

      nextState.test(data, function(err, passed) {
        if (err) {
          return cb(err);
        }

        if (passed) {
          // recursive here
          debug('Moved to state:', nextStateName);
          return self.run(data, nextStateName, cb);
        }

        next();
      });
    }, function(err) {
      if (err) {
        return cb(err);
      }

      // if we hit here we've not moved to another state, therefore we should return the current state
      cb(null, currentStateName);
    });
  };
};

export default Bucketr;
