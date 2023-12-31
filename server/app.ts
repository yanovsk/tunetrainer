import AccessControl from "./concepts/access_control";
import FriendConcept from "./concepts/friend";
import PostConcept from "./concepts/post";
import SongCollectionConcept from "./concepts/songcollection";
import SongifiedNoteConcept from "./concepts/songifiednote";
import StudyToolConcept from "./concepts/studytool";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const SongCollection = new SongCollectionConcept();
export const SongifiedNote = new SongifiedNoteConcept();
export const StudyTool = new StudyToolConcept();
export const CollectionAccessControl = new AccessControl("collection");
export const SongifiedNoteAccessControl = new AccessControl("songifiedNote");
