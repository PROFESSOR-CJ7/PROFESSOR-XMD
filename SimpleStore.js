const { EventEmitter } = require('events');

class SimpleStore extends EventEmitter {
  constructor() {
    super();
    this.chats = new Map();
  }

  set(key, value) {
    this.chats.set(key, value);
    this.emit('update', key, value);
  }

  get(key) {
    return this.chats.get(key);
  }

  delete(key) {
    this.chats.delete(key);
  }

  bind(ev) {
    ev.on('messages.upsert', ({ messages }) => {
      messages.forEach(msg => {
        this.set(msg.key.id, msg);
      });
    });

    ev.on('messages.update', ({ messages }) => {
      messages.forEach(msg => {
        this.set(msg.key.id, msg);
      });
    });

    ev.on('messages.delete', ({ keys }) => {
      keys.forEach(key => {
        this.delete(key.id);
      });
    });
  }
}

module.exports = SimpleStore;
