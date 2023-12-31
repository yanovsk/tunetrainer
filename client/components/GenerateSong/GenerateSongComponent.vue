<script setup lang="ts">
import { ref } from "vue";

import router from "@/router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { fetchy } from "../../utils/fetchy";
const userStore = useUserStore();
const { currentUsername } = storeToRefs(userStore);

const userNotes = ref("");
const apiResponse = ref("");
const errorMessage = ref("");
const loading = ref(false);
interface SongCollectionDoc {
  _id: string;
  title: string;
  description: string;
  songifiedNotes: string[]; // Replace with the correct type if not string
  owner: string; // Replace with the correct type if not string
  upvotes: number;
}

const props = defineProps(["collections"]);
const userCollections = ref<SongCollectionDoc[]>(props.collections);
const chosenCollection = ref<SongCollectionDoc>();

const editMode = ref(false); //some buttons should NOT be visible before and after lyrics generation
const chosenTemplate = ref("");
const chosenSong = ref("");
const editedLyrics = ref("");
const backgroundSongPath = ref("");
const noteID = ref(""); //AFTER WE SUBMIT CALL TO SONGIFY

// DEFAULT FOR NOW:
const templates = ref([
  {
    title: "Moves Like Jagger",
    lyrics:
      "Oh, na, oh Just shoot for the stars, if it feels right Then aim for my heart, if you feel like And take me away And make it okay I swear, I'll behave You wanted control, so we waited I put on a show, now we're naked You say, I'm a kid My ego is big I don't give a shit And it goes like this take me by the tongue, and I'll know you (Ah) kiss me till you're drunk, and I'll show you All the moves like Jagger I've got the moves like Jagger I've got the moo-oo-oo-ooves like Jagger I don't need try to control you (Ah) look into my eyes, and I'll own you With them the moves like Jagger I've got the moves like Jagger I've got the moo-oo-oo-ooves like Jagger",
    path: "/songs/moves_like_jagger.mp3",
  },

  {
    title: "Shape of You",
    lyrics: `The club isn't the best place to find a lover\n
      So the bar is where I go \n
      Me and my friends at the table doing shots \n
      Drinking fast and then we talk slow \n
      Come over and start up a conversation with just me \n
      And trust me I'll give it a chance now \n
      Take my hand, stop, put Van the Man on the jukebox \n
      And then we start to dance, and now I'm singing like \n
      Girl, you know I want your love \n
      Your love was handmade for somebody like me \n
      Come on now, follow my lead \n
      I may be crazy, don't mind me \n
      Say, boy, let's not talk too much\n
      Grab on my waist and put that body on me\n
      Come on now, follow my lead \n
      Come, come on now, follow my lead \n`,
    path: "/songs/shape_of_you.mp3",
  },

  {
    title: "Jingle Bell Rock",
    lyrics: `Jingle bell, jingle bell, jingle bell rock \n
      Jingle bells swing and jingle bells ring\n
      Snowin' and blowin' up bushels of fun \n
      Now the jingle hop has begun\n
      Jingle bell, jingle bell, jingle bell rock\n
      Jingle bells chime in jingle bell time\n
      Dancin' and prancin' in Jingle Bell Square\n
      In the frosty air\n
      What a bright time, it's the right time\n
      To rock the night away\n
      Jingle bell time is a swell time\n
      To go glidin' in a one-horse sleigh\n
      Giddy-up jingle horse, pick up your feet\n
      Jingle around the clock\n
      Mix and a-mingle in the jinglin' feet\n
      That's the jingle bell rock\n`,

    path: "/songs/jingle_bell_rock.mp3",
  },
]);

const submitNotes = async () => {
  if (!chosenTemplate.value) {
    alert("Choose song template please");
    return;
  }
  errorMessage.value = "";
  loading.value = true;
  apiResponse.value = "";

  try {
    let rawNote = userNotes.value;
    let lyricsTemplate = chosenTemplate.value;
    let backgroundMusicLink = backgroundSongPath.value;
    let query = { rawNote, lyricsTemplate, backgroundMusicLink };
    const response = await fetchy(`/api/generate/songifiednote`, "POST", { query });
    apiResponse.value = response.songifiednote.generatedLyrics;
    noteID.value = response.songifiednote._id;
  } catch (error) {
    console.error("Error submitting notes:", error);
    errorMessage.value = "Failed to submit notes. Please try again.";
  } finally {
    loading.value = false;
    editMode.value = true;
    editedLyrics.value = apiResponse.value;
  }
};

const changeTemplate = async (lyrics: string, title: string, path: string) => {
  chosenTemplate.value = lyrics;
  chosenSong.value = title;
  backgroundSongPath.value = path;
  //in an ideal world we do a request to load template, or have it loaded already
};

const deleteNote = async () => {
  if (confirm("Are you sure you want to delete?")) {
    loading.value = true;

    let query = { _id: noteID.value };
    await fetchy("/api/delete/songifiednote", "DELETE", { query });
    window.history.go(); //refresh page
  }
};

const finalSave = async () => {
  if (chosenCollection.value) {
    loading.value = true;

    let query = { collection_id: chosenCollection.value._id, songifiedNoteToAdd: noteID.value };
    await fetchy(`/api/addnote/collection`, "POST", { query });
    void router.push({ name: "Collection", params: { id: chosenCollection.value._id } });
  } else {
    alert("Must choose collection to add to first");
  }
  // update with edit
  // add to collection
};
</script>

<template>
  <div class="column-container">
    <div class="notes-container">
      <textarea v-model="userNotes" placeholder="Enter your notes here..." rows="10" class="notes-textarea"></textarea>
      <section class="selection" v-if="!editMode">
        <button class="dropdown">
          {{ chosenSong ? chosenSong : "Choose Tune" }}
          <div class="template-dropdown">
            <div v-for="temp in templates" :key="temp.lyrics">
              <button class="song-template" @click="changeTemplate(temp.lyrics, temp.title, temp.path)">
                {{ temp.title }}
              </button>
            </div>
          </div>
        </button>

        <button type="submit" @click="submitNotes">Submit Notes</button>
      </section>
      <span class="error-message">{{ errorMessage }}</span>
    </div>
    <div class="response-container" v-if="!editMode">
      <div v-if="loading" class="loading-message">
        <div class="spinner"></div>
        Generating the song...
      </div>
      <h3 v-else>Enter your notes!</h3>
    </div>
    <div class="response-container" v-else>
      <div style="text-align: right">
        <span class="dropdown" style="padding: 3px 5px">{{ chosenSong }}</span>
      </div>
      <textarea v-model="editedLyrics" :placeholder="editedLyrics" class="response-text"></textarea>

      <section class="selection" style="float: left">
        <button class="dropdown" style="margin: 0">
          {{ chosenCollection ? chosenCollection.title : "Add to Collection" }}

          <div class="template-dropdown">
            <div v-for="collection in userCollections" :key="collection._id">
              <button class="song-template" @click="chosenCollection = collection">
                {{ collection.title }}
              </button>
            </div>
          </div>
        </button>
        <button class="cancel-button" @click="deleteNote()">Discard</button>
      </section>

      <span style="float: right">
        <button type="submit" style="display: inline" @click="finalSave()">Save</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.cancel-button {
  background: 0;
  border: 0;
  color: #999;
  font-weight: 500;
}
.cancel-button:hover {
  color: #5cb48c;
}
.selection {
  display: flex;
  column-gap: 10px;
}
.dropdown {
  width: 100%;
  background-color: #fff;
  color: #5cb48c;
  border: solid 2px #5cb48c;
  padding: 14px 20px;
  margin: 8px 0;
  border-radius: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  font-size: 15px;
  position: relative;
  display: inline;
}
.column-container {
  display: flex;
  width: 100%;
  gap: 15px;
}

.template-dropdown {
  display: none;
  margin: 0 0 -20% -8%;
  background-color: #fff;
  border-radius: 5px;
  width: 100%;
  padding-bottom: 2%;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
  position: absolute;
}
.dropdown:hover .template-dropdown {
  display: block;
}
.song-template {
  color: #999;
  border: 0;
  width: 100%;
  text-align: left;
  font-size: 20px;
  background: 0;
  padding: 3% 5%;
  border-bottom: solid 1px #999;
}
.song-template:hover {
  color: #5cb48c;
  border-color: #5cb48c;
  font-weight: 6000;
}

.notes-container,
.response-container {
  flex: 1;
  padding: 2.3% 2.5%;
  margin: 0 auto;
  background-color: white;
  border: 1.5px solid #000;
  border-radius: 15px;
}

.notes-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid lightgray;
  border-radius: 9px;
  margin-bottom: 5px;
  resize: vertical;
}

.submit-button {
  padding: 8px 16px;
  border: 0.3px solid lightgray;
  border-radius: 4px;
  cursor: pointer;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.response-text {
  white-space: pre-wrap;
  line-height: 15px;
  border-radius: 9px;
  padding: 8px;
  margin: 5% 0;
  width: 97%;
  height: 50%;
  resize: vertical;
  flex: 1;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #09f;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-message {
  color: blue;
  font-size: 1.2em;
}
</style>
