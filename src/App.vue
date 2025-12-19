<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import IconLabelButton from '@/components/IconLabelButton.vue'
</script>

<template>
  <header>
    <h1>Fuel Stats</h1>
    <RouterLink to="/settings">
      <IconLabelButton icon="person" />
    </RouterLink>
  </header>

  <main>
    <RouterView />
  </main>

  <nav>
    <RouterLink to="/">
      <IconLabelButton label="Home" icon="home" />
    </RouterLink>

    <RouterLink to="/add">
      <IconLabelButton label="Add" icon="add" />
    </RouterLink>

    <RouterLink to="/vehicles">
      <IconLabelButton label="Vehicles" icon="directions_car" />
    </RouterLink>

    <RouterLink to="/history">
      <IconLabelButton label="History" icon="history" />
    </RouterLink>
  </nav>
</template>

<style scoped>
header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 0 var(--space-md);
}

nav {
  position: fixed;
  bottom: 0;
  width: 100vw;
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  align-items: center;
}

nav a,
header a {
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
