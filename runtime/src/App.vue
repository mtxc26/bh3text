<template>
    <div class="vapp-content-main-wrapper">
        <a-config-provider :autoInsertSpaceInButton="false">
            <Sidebar></Sidebar>
            <router-view></router-view>
            <Settings></Settings>
        </a-config-provider>
    </div>
</template>

<script setup lang="ts">
import { ConfigProvider as AConfigProvider } from 'ant-design-vue';
import Sidebar from '@/components/Sidebar.vue'
import Settings from './components/Settings.vue';

</script>

<style scoped>
.vapp-content-main-wrapper {
    display: block;
    box-sizing: border-box;
}
</style>
