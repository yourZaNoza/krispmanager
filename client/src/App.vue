<!-- src/App.vue -->
<template>
  <v-app>
    <RouterView />
  </v-app>
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style>
body {
  background-color: rgb(var(--v-theme-background)) !important;
  margin: 0;
  padding: 0;
}

html {
  background-color: rgb(var(--v-theme-background)) !important;
}
</style>
