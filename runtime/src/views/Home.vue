<template>
    <div></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { SetupLastReadUI } from '@/preferences/last-read';

onMounted(() => {
    SetupLastReadUI();
})

</script>
