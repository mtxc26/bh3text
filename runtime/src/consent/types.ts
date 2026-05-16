export interface CookieConsent {
    n: boolean;
    f: boolean;
    p: boolean;
    t: boolean;
    ns?: boolean;
    _a?: boolean;
}

export type ConsentCategory = keyof CookieConsent;

export interface ConsentCategoryInfo {
    key: ConsentCategory;
    label: string;
    description: string;
    required: boolean;
}

export const CONSENT_CATEGORIES: ConsentCategoryInfo[] = [
    {
        key: 'n',
        label: '必要',
        description: '这些 Cookies 为网站核心功能所必需，例如识别用户和防止网络攻击。网站需要使用这些 Cookies 才能正常运作。',
        required: true,
    },
    {
        key: 'f',
        label: '功能',
        description: '这些 Cookies 帮助我们存储您的偏好设置，例如语言和时区。关闭它们将导致部分功能或设置无法持久化保存。我们强烈建议您启用这类 Cookies 。',
        required: false,
    },
    {
        key: 'p',
        label: '性能',
        description: '这些 Cookies 用于统计访问数据和情况，以帮助我们改进服务。我们推荐您启用这类 Cookies 。',
        required: false,
    },
    {
        key: 't',
        label: '定向',
        description: '这些 Cookies 用于提供个性化内容和广告。我们建议您不要启用这类 Cookies 。',
        required: false,
    },
];
