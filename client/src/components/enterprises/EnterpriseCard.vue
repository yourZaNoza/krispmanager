<template>
  <v-card variant="outlined" rounded="lg" class="enterprise-card pa-3" style="cursor: pointer" @click="$emit('edit')">
    <div class="d-flex align-center justify-space-between mb-2">
      <p class="text-body-2 font-weight-medium card-name">{{ enterprise.name }}</p>
      <v-btn icon size="x-small" variant="plain" density="compact" @click.stop="$emit('delete')">
        <v-icon size="16" color="grey">mdi-delete-outline</v-icon>
      </v-btn>
    </div>

    <div class="d-flex flex-column text-caption text-grey-darken-1" style="gap: 4px">
      <span v-if="enterprise.city" class="d-flex align-center" style="gap: 4px">
        <v-icon size="13">mdi-map-marker-outline</v-icon>
        {{ enterprise.city }}
      </span>
      <span v-if="enterprise.address" class="d-flex align-center" style="gap: 4px">
        <v-icon size="13">mdi-home-outline</v-icon>
        <span class="address-link">{{ enterprise.address }}</span>
      </span>
      <span v-if="enterprise.phone" class="d-flex align-center" style="gap: 4px">
        <v-icon size="13">mdi-phone-outline</v-icon>
        {{ enterprise.phone }}
      </span>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  enterprise: { type: Object, required: true },
})
defineEmits(['edit', 'delete'])
</script>

<style scoped>
.enterprise-card {
  border-color: #e0e0e0 !important;
  transition: box-shadow 0.15s;
}
.enterprise-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
.card-name {
  line-height: 1.4;
  margin: 0;
}
.address-link {
  color: #1565C0;
  text-decoration: underline;
}
</style>
