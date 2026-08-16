import { PersistenceService } from './PersistenceService';

export interface Episode {
  id: string;
  videoUrl: string;
  nextEpisodeUrl?: string;
  title?: string;
  duration?: number;
}

export interface ChannelDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  genres: string[];
  episodes: Episode[];
  order: number;
  createdAt: string;
  isActive: boolean;
}

export interface ChannelFile {
  version: string;
  channels: ChannelDefinition[];
  metadata: {
    importedAt: string;
    source: string;
  };
}

export class ChannelManager {
  private channels: Map<string, ChannelDefinition> = new Map();
  private channelRegistry: ChannelDefinition[] = [];

  constructor(private persistenceService: PersistenceService) {
    this.loadChannelsFromDatabase();
  }

  /**
   * Validate channel JSON file structure before injection
   */
  public validateChannelFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file type
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      errors.push('File must be JSON format');
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      errors.push('File exceeds 50MB limit');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse JSON file and extract channel definitions
   */
  public async parseChannelFile(file: File): Promise<ChannelFile | null> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate JSON structure
      if (!data.channels || !Array.isArray(data.channels)) {
        throw new Error('Invalid file structure: missing "channels" array');
      }

      return data as ChannelFile;
    } catch (error: any) {
      console.error('Failed to parse channel file:', error.message);
      throw new Error(`JSON Parse Error: ${error.message}`);
    }
  }

  /**
   * ✅ CRITICAL: Validate each channel before adding
   */
  private validateChannelStructure(channel: any): boolean {
    // Required fields
    const required = ['id', 'name', 'genres', 'episodes'];
    for (const field of required) {
      if (!channel[field]) {
        console.warn(`Channel missing required field: ${field}`);
        return false;
      }
    }

    // Validate episodes array
    if (!Array.isArray(channel.episodes) || channel.episodes.length === 0) {
      console.warn('Channel has no episodes');
      return false;
    }

    // Validate each episode
    for (const episode of channel.episodes) {
      if (!episode.id || !episode.videoUrl || typeof episode.duration !== 'number') {
        console.warn(`Invalid episode in channel "${channel.id}"`);
        return false;
      }
    }

    // Validate genres array
    if (!Array.isArray(channel.genres) || channel.genres.length === 0) {
      console.warn('Channel has no genres');
      return false;
    }

    return true;
  }

  /**
   * ✅ Inject new channel (idempotent—prevents duplicates)
   */
  public async injectChannel(channel: ChannelDefinition): Promise<string> {
    // Check for duplicate
    if (this.channels.has(channel.id)) {
      console.warn(`Channel "${channel.id}" already exists. Skipping injection.`);
      return channel.id;
    }

    // Validate structure
    if (!this.validateChannelStructure(channel)) {
      throw new Error(`Channel validation failed: "${channel.id}"`);
    }

    // Assign order
    const order = this.channelRegistry.length;
    const enrichedChannel: ChannelDefinition = {
      ...channel,
      order,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Register in memory
    this.channels.set(channel.id, enrichedChannel);
    this.channelRegistry.push(enrichedChannel);

    // Persist to database
    await this.persistenceService.saveChannel(enrichedChannel);

    console.log(`✅ Channel "${channel.name}" injected successfully`);
    window.dispatchEvent(new CustomEvent('channels-updated'));
    return channel.id;
  }

  /**
   * Batch inject channels from parsed file
   */
  public async injectChannelsFromFile(channelFile: ChannelFile): Promise<{
    successful: string[];
    failed: Array<{ channelId: string; reason: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ channelId: string; reason: string }> = [];

    for (const channel of channelFile.channels) {
      try {
        const channelId = await this.injectChannel(channel);
        successful.push(channelId);
      } catch (error: any) {
        failed.push({
          channelId: channel.id || 'unknown',
          reason: error.message
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get all active channels (for tab generation)
   */
  public getActiveChannels(): ChannelDefinition[] {
    return this.channelRegistry.filter(ch => ch.isActive);
  }

  /**
   * Get all genres across all channels
   */
  public getAllGenresTabs(): string[] {
    const genreSet = new Set<string>();

    for (const channel of this.getActiveChannels()) {
      channel.genres.forEach(genre => genreSet.add(genre));
    }

    return Array.from(genreSet).sort();
  }

  /**
   * Get episodes by genre across all channels
   */
  public getEpisodesByGenre(genre: string): Array<Episode & { channelId: string }> {
    const episodes: Array<Episode & { channelId: string }> = [];

    for (const channel of this.getActiveChannels()) {
      if (channel.genres.includes(genre)) {
        channel.episodes.forEach(ep => {
          episodes.push({
            ...ep,
            channelId: channel.id
          });
        });
      }
    }

    return episodes;
  }

  /**
   * Deactivate channel (soft delete)
   */
  public async deactivateChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.isActive = false;
      await this.persistenceService.updateChannel(channel);
      window.dispatchEvent(new CustomEvent('channels-updated'));
    }
  }

  /**
   * Load channels from database on app init
   */
  private async loadChannelsFromDatabase() {
    try {
      const savedChannels = await this.persistenceService.getAllChannels();
      for (const channel of savedChannels) {
        this.channels.set(channel.id, channel);
        if (channel.isActive) {
          this.channelRegistry.push(channel);
        }
      }
      window.dispatchEvent(new CustomEvent('channels-updated'));
    } catch (error) {
      console.error('Failed to load channels from database:', error);
    }
  }

  /**
   * Get channel by ID
   */
  public getChannelById(channelId: string): ChannelDefinition | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Clear all channels (debug only)
   */
  public async clearAllChannels(): Promise<void> {
    this.channels.clear();
    this.channelRegistry.length = 0;
    await this.persistenceService.deleteAllChannels();
    window.dispatchEvent(new CustomEvent('channels-updated'));
  }
}
