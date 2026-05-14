<template>
    <div class="vapp-content-main-wrapper">
        <a-config-provider :autoInsertSpaceInButton="false">
            <Sidebar></Sidebar>
            <router-view></router-view>
        </a-config-provider>
    </div>
</template>

<script setup lang="ts">
import { ConfigProvider as AConfigProvider } from 'ant-design-vue';
import Sidebar from '@/components/Sidebar.vue'

</script>

<style scoped>
.vapp-content-main-wrapper {
    display: block;
    box-sizing: border-box;
}
</style>
