<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import IconLabelButton from '@/components/IconLabelButton.vue'

const route = useRoute()

const showNav = computed(() => !route.meta.hideNav)
const showHeader = computed(() => !route.meta.hideHeader)
</script>

<template>
  <div class="app-layout">
    <!-- Desktop Sidebar -->
    <aside v-if="showNav" class="desktop-sidebar">
      <div class="sidebar-brand">
        <span class="material-symbols-outlined brand-icon">local_gas_station</span>
        <span class="brand-name">Fuel Stats</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink to="/" class="sidebar-item">
          <span class="material-symbols-outlined">home</span>
          <span class="sidebar-label">Home</span>
        </RouterLink>
        <RouterLink to="/add" class="sidebar-item">
          <span class="material-symbols-outlined">add</span>
          <span class="sidebar-label">Add Record</span>
        </RouterLink>
        <RouterLink to="/vehicles" class="sidebar-item">
          <span class="material-symbols-outlined">directions_car</span>
          <span class="sidebar-label">Vehicles</span>
        </RouterLink>
        <RouterLink to="/history" class="sidebar-item">
          <span class="material-symbols-outlined">history</span>
          <span class="sidebar-label">History</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <RouterLink to="/settings" class="sidebar-item">
          <span class="material-symbols-outlined">person</span>
          <span class="sidebar-label">Settings</span>
        </RouterLink>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-container">
      <header v-if="showHeader">
        <h1>{{ route.meta.title ?? 'Fuel Stats' }}</h1>
        <RouterLink to="/settings" class="settings-link">
          <IconLabelButton icon="person" />
        </RouterLink>
      </header>

      <main>
        <div class="page-content">
          <RouterView />
        </div>
      </main>

      <!-- Mobile Bottom Nav -->
      <nav v-if="showNav" class="mobile-nav">
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
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-primary);
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: var(--space-md);
}

.settings-link {
  display: flex;
  justify-content: center;
  align-items: center;
  text-decoration: none;

  @media (min-width: 768px) {
    display: none;
  }
}

.mobile-nav {
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
  z-index: 100;

  @media (min-width: 768px) {
    display: none !important;
  }
}

/* active link */
.mobile-nav :deep(a.router-link-active .icon-label-button) {
  opacity: 1;
}

/* inactive links */
.mobile-nav :deep(a .icon-label-button) {
  opacity: 0.6;
  transition: opacity 0.15s;
}

.mobile-nav a,
header a {
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
}

header a :deep(.material-symbols-outlined) {
  font-size: 3rem;
}

main {
  padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + var(--space-md));

  @media (min-width: 768px) {
    padding-bottom: var(--space-xl);
  }
}

.page-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Desktop Sidebar styles */
.desktop-sidebar {
  display: none;

  @media (min-width: 768px) {
    display: flex;
    flex-direction: column;
    width: 260px;
    background-color: var(--bg-secondary);
    border-right: 1px solid var(--border-default);
    padding: var(--space-xl) var(--space-md);
    height: 100vh;
    position: sticky;
    top: 0;
    justify-content: space-between;
    z-index: 10;
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-left: var(--space-sm);
  margin-bottom: var(--space-xl);

  .brand-icon {
    font-size: 2.25rem;
    color: var(--color-primary-light);
  }

  .brand-name {
    font-size: var(--font-size-xl);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 600;
  transition: all 150ms ease;

  .material-symbols-outlined {
    font-size: 1.5rem;
    font-variation-settings: 'FILL' 0;
    transition: color 150ms ease;
  }

  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }

  &.router-link-active {
    background-color: var(--bg-selected);
    color: var(--text-primary);
    border-left: 4px solid var(--color-primary-light);
    padding-left: calc(var(--space-md) - 4px); /* Offset border width */

    .material-symbols-outlined {
      color: var(--color-primary-light);
      font-variation-settings: 'FILL' 1;
    }
  }
}

.sidebar-footer {
  border-top: 1px solid var(--border-muted);
  padding-top: var(--space-md);
}

@media (min-width: 768px) {
  header {
    margin: var(--space-xl) var(--space-md) var(--space-lg) var(--space-md);

    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
  }
}
</style>
