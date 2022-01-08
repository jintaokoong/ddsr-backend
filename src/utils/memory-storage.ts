class MemoryStorage {
  private list: string[];
  constructor() {
    this.list = [];
  }

  append = (id: string) => {
    this.list = [...this.list, id];
  };

  remove = (id: string) => {
    const item = this.list.find((i) => i == id);
    if (!item) {
      return false;
    }
    this.list = this.list.filter((i) => i !== id);
    return true;
  };
}

const memoryStorage = new MemoryStorage();

export default memoryStorage;
