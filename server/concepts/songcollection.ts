import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface SongCollectionDoc extends BaseDoc {
  title: string;
  description: string;
  songifiedNotes: ObjectId[];
  owner: ObjectId;
  upvotes: number;
}

export default class SongCollectionConcept {
  public readonly songCollections = new DocCollection<SongCollectionDoc>("songCollections");

  async create(owner: ObjectId, title: string, description: string) {
    const _id = await this.songCollections.createOne({
      title: title,
      description: description,
      songifiedNotes: [],
      owner: owner,
      upvotes: 0,
    });
    return { msg: "Song Collection successfully created!", songCollection: await this.songCollections.readOne({ _id }) };
  }

  async getCollection(query: Filter<SongCollectionDoc>) {
    const songCollections = await this.songCollections.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return songCollections;
  }

  async getCollectionById(_id: ObjectId) {
    const doc = await this.songCollections.readOne({ _id });
    return doc;
  }

  async getSongsInColection(_id: ObjectId): Promise<Array<ObjectId>> {
    const collectionDoc: SongCollectionDoc | null = await this.getCollectionById(_id);

    if (collectionDoc === null) {
      throw new Error("Collection not found");
    }

    return collectionDoc.songifiedNotes;
  }

  async getByAuthor(owner: ObjectId) {
    const songCollections = await this.songCollections.readMany(
      { owner: owner },
      {
        sort: { dateUpdated: -1 },
      },
    );
    return songCollections;
  }

  async updateNote(_id: string, update: Partial<SongCollectionDoc>) {
    this.sanitizeUpdate(update);
    const id = new ObjectId(_id);
    await this.songCollections.updateOne({ _id: id }, update);
    return { msg: "Collection successfully updated!" };
  }

  async addNote(collection_id: string, songifiedNoteToAdd: string) {
    const collection = await this.songCollections.readOne(new ObjectId(collection_id));
    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    const idToAdd = new ObjectId(songifiedNoteToAdd);
    let updatedSongifiedNotes;
    if (collection.songifiedNotes) {
      updatedSongifiedNotes = [...collection.songifiedNotes, idToAdd];
    } else {
      updatedSongifiedNotes = [idToAdd];
    }

    await this.songCollections.updateOne({ _id: new ObjectId(collection_id) }, { songifiedNotes: updatedSongifiedNotes });
    return { msg: "Note added to collection successfully!" };
  }

  async deleteCollection(_id: string) {
    const id = new ObjectId(_id);
    await this.songCollections.deleteOne({ _id: id });
    return { msg: "Collection deleted successfully!" };
  }

  async deleteNoteFromCollection(collection_id: string, songifiedNoteId: string) {
    const songCollection = await this.songCollections.readOne({ _id: new ObjectId(collection_id) });

    if (songCollection && songCollection.songifiedNotes) {
      // Filter out the songifiedNoteId from the songifiedNotes array
      const updatedSongifiedNotes = songCollection.songifiedNotes.filter((noteId) => noteId.toString() !== songifiedNoteId);
      await this.updateNote(collection_id, { songifiedNotes: updatedSongifiedNotes });
    }
    return { msg: "Collection successfully updated!" };
  }

  // async deleteNoteFromAllCollections(songifiedNote: ObjectId, update: Partial<SongCollectionDoc>) {
  //   const songcollection = await this.songCollections.readMany({});
  //   for (const songdoc of songcollection) {
  //     const currSongs = songdoc.songifiedNotes;
  //     const index = currSongs.indexOf(songifiedNote);
  //     if (index !== -1) {
  //       currSongs.splice(index, 1);
  //       update.songifiedNotes = currSongs;
  //       await this.songCollections.updateOne(currSongs, update);
  //     }
  //   }
  //   return { msg: "collections successfully updated!" };
  // }

  // async updateUpvote(songCollection: ObjectId) {
  //   const collection = await this.songCollections.readOne({ songCollection });
  //   if (collection !== null) {
  //     const upvote = collection.upvotes.toString();
  //     const num = parseInt(upvote);
  //     const plusone = num + 1;
  //     const updatedUpvotes = plusone.toString();
  //     return updatedUpvotes;
  //   }
  // }

  // async doUpvote(songCollection: ObjectId) {
  //   return await this.songCollections.updateOne({ songCollection }, { upvotes: await this.updateUpvote(songCollection) });
  // }

  async isOwner(isOwnerInput: { user: ObjectId; _id: ObjectId }) {
    const songCollection = await this.songCollections.readOne({ _id: isOwnerInput._id });
    if (!songCollection) {
      throw new NotFoundError(`Collection ${isOwnerInput._id} does not exist!`);
    }
    if (songCollection.owner.toString() !== isOwnerInput.user.toString()) {
      throw new CollectionAuthorNotMatchError(isOwnerInput.user, isOwnerInput._id);
    }
  }

  private sanitizeUpdate(update: Partial<SongCollectionDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "options", "title", "description", "songifiedNotes", "songifiednote"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class CollectionAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}
