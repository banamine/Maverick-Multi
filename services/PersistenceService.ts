export class PersistenceService {
  private STORAGE_KEY = 'maverick_channels';

  public async saveChannel(channel: any): Promise<void> {
    const channels = await this.getAllChannels();
    channels.push(channel);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(channels));
  }

  public async updateChannel(channel: any): Promise<void> {
    let channels = await this.getAllChannels();
    channels = channels.map(c => c.id === channel.id ? channel : c);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(channels));
  }

  public async getAllChannels(): Promise<any[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  public async deleteAllChannels(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
