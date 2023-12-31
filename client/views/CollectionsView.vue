<script setup lang="ts">
import CreateCollectionComponent from "@/components/Collection/CreateCollectionComponent.vue";
import MultiCollectionsComponent from "@/components/Collection/MultiCollectionsComponent.vue";

import router from "@/router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import { fetchy } from "../utils/fetchy";

const userStore = useUserStore();
const { currentUsername } = storeToRefs(userStore);

const user = ref(router.currentRoute.value.params.user);
const loaded = ref(false);
const collections = ref<Array<Record<string, string>>>([]);
const sharedCollections = ref<Array<Record<string, string>>>([]);
const canEdit = ref(true);
const canEditShared = ref(false);

//finds all collections owned/shared by user
onBeforeMount(async () => {
  try {
    const response = await fetchy(`/api/users/${user.value}/collections`, "GET", {});
    collections.value = response;
    const sharedResponse = await fetchy(`/api/otherusers/accessiblecollections`, "GET");
    sharedCollections.value = sharedResponse;

    const publicCollectionsresponse = await fetchy(`/api/publiccollections`, "GET");
  } catch (error) {
    console.error("Error getting collection notes:", error);
  } finally {
    loaded.value = true;
  }
});
</script>

<template>
  <main class="container">
    <h3 class="major-labels">Collect<span style="color: #000">ions</span></h3>
    <CreateCollectionComponent v-if="user == currentUsername" />
    <MultiCollectionsComponent style="margin-top: 4em" v-if="loaded" :collections="collections" headerText="Collections" :canEdit="canEdit" />
    <MultiCollectionsComponent v-if="loaded" :collections="sharedCollections" headerText="Shared Collections" :canEdit="canEditShared" />
  </main>
</template>

<style scoped>
.global-page-layout {
  max-width: 90%;
}
</style>
