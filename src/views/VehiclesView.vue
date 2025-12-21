<template>
  <div id="vehicles">
    <div class="vehicle favorite">
      <div class="left-wrp">
        <div class="v-default">
          <IconLabelButton icon="star" />
        </div>
        <div class="v-info">
          <b>Octavia</b>
          <p>9U47159 • Diesel • Note</p>
        </div>
      </div>
      <div class="v-actions">
        <IconLabelButton class="i-edit" icon="edit" />
        <IconLabelButton class="i-delete" icon="delete" />
      </div>
    </div>

    <!--
    <div class="vehicle">
      <div class="left-wrp">
        <div class="v-default">
          <IconLabelButton icon="star" />
        </div>
        <div class="v-info">
          <b>Octavia</b>
          <p>9U47159 • Diesel • Note</p>
        </div>
      </div>
      <div class="v-actions">
        <IconLabelButton class="i-edit" icon="edit" />
        <IconLabelButton class="i-delete" icon="delete" />
      </div>
    </div>

    <div class="vehicle favorite">
      <div class="left-wrp">
        <div class="v-default">
          <IconLabelButton icon="star" />
        </div>
        <div class="v-info">
          <b>Octavia</b>
          <p>9U47159 • Diesel • Note</p>
        </div>
      </div>
      <div class="v-actions">
        <IconLabelButton class="i-edit" icon="edit" />
        <IconLabelButton class="i-delete" icon="delete" />
      </div>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import IconLabelButton from '@/components/IconLabelButton.vue'
import { onMounted, ref } from 'vue'
import api from '@/lib/api'

const vehicles = ref([])

onMounted(async () => {
  try {
    const res = await api.get('/vehicles')
    console.log(res)
    vehicles.value = res.data
  } catch (err) {
    console.error(err)
  }
})
</script>

<style lang="scss" scoped>
#vehicles {
  display: flex;
  flex-direction: column;
  margin: 0 var(--space-md);
  gap: var(--space-md);

  .vehicle {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-color: var(--bg-secondary);
    border-style: solid;
    padding: var(--space-md);
    border-radius: var(--radius-md);
  }
}

.vehicle.favorite .v-default :deep(.material-symbols-outlined) {
  color: var(--color-favorite);
}

.vehicle .v-actions .i-edit :deep(.material-symbols-outlined) {
  color: var(--color-primary);
}

.vehicle .v-actions .i-delete :deep(.material-symbols-outlined) {
  color: var(--color-danger);
}

.left-wrp,
.v-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-md);
}
</style>
