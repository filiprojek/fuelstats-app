<script setup lang="ts">
import { useRoute } from 'vue-router'
import IconLabelButton from '@/components/IconLabelButton.vue'

const route = useRoute()
</script>

<template>
  <header>
    <h1>{{ route.meta.title ?? 'Fuel Stats' }}</h1>
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

<style lang="scss">
header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: var(--space-md);
}

nav {
  position: fixed;
  bottom: 0;
  width: 100vw;
  display: flex;
  gap: var(--space-xxl);
  justify-content: center;
  align-items: center;
  background-color: var(--bg-primary);
  border-color: var(--bg-secondary);
  border-style: solid hidden hidden hidden;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
}

nav a,
header a {
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
}

header .material-symbols-outlined {
  font-size: 3rem;
}

main {
  padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + var(--space-md));
}
</style>
