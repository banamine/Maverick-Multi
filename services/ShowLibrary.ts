export interface Episode {
  videoUrl: string;
  nextEpisodeUrl?: string;
  title?: string;
}

export interface Show {
  id: string;
  title: string;
  episodes: Episode[];
}

export interface LibraryData {
  shows: Show[];
}

export class ShowLibrary {
  private data: LibraryData;

  constructor(initialData: LibraryData) {
    this.data = initialData;
  }

  public getAllGenres(): string[] {
    return ['Action', 'Comedy', 'Drama']; // Mock implementation
  }

  public getShowsByGenre(genre: string): Show[] {
    return this.data.shows; // Mock implementation
  }
}
