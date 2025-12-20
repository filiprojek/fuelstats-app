<script setup lang="ts">
import IconLabelButton from '@/components/IconLabelButton.vue'
</script>
<template>
  <section id="settings">
    <h2>User Name</h2>
    <p>users@email.com</p>
    <IconLabelButton id="btn-signout" label="Sign Out" icon="logout" inline elevated />
  </section>
</template>

<style lang="scss" scoped>
section#settings {
  margin: 0 var(--space-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-md);
  height: 60vh;
}

#btn-signout {
  width: 8rem;
  background-color: var(--color-danger);
}
</style>
