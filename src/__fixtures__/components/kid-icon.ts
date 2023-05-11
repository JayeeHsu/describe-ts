import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { ifDefined } from 'lit/directives/if-defined.js';


export enum EIconType {
    SVG = 0,
    IMAGE = 1,
}

export type IIconConfig = [EIconType, string, string, string, string];

/**
 * @summary [@ks/kw](https://npm.corp.kuaishou.com/-/web/detail/@ks/kw)的WebComponents版本。
 *
 * @example 无效 <gl-kid-icon></gl-kid-icon>
 * @example 默认 <gl-kid-icon config="[0,&quot;commercial_niu_data_expend_blue&quot;,&quot;<path fill=\&quot;currentColor\&quot; fill-rule=\&quot;evenodd\&quot; stroke=\&quot;currentColor\&quot; stroke-width=\&quot;68.267\&quot; d=\&quot;M512 119.467C620.373 119.467 718.507 163.413 789.56 234.439A391.31 391.31 0 0 1 904.534 512C904.533 620.373 860.587 718.507 789.561 789.56A391.31 391.31 0 0 1 512 904.534 391.396 391.396 0 0 1 234.44 789.561 391.31 391.31 0 0 1 119.466 512C119.467 403.627 163.413 305.493 234.439 234.44A391.31 391.31 0 0 1 512 119.466ZM714.41 325.177 579.528 456.192 455.253 332.8 196.693 588.117 304.64 697.457 454.969 548.95 578.36 671.46 821.419 435.343 714.41 325.177Z\&quot;></path>&quot;,&quot;#0B69FF&quot;,&quot;&quot;]"></gl-kid-icon>
 * @example 30px，红色 <gl-kid-icon size="30px" color="red" config="[0,&quot;commercial_niu_data_expend_blue&quot;,&quot;<path fill=\&quot;currentColor\&quot; fill-rule=\&quot;evenodd\&quot; stroke=\&quot;currentColor\&quot; stroke-width=\&quot;68.267\&quot; d=\&quot;M512 119.467C620.373 119.467 718.507 163.413 789.56 234.439A391.31 391.31 0 0 1 904.534 512C904.533 620.373 860.587 718.507 789.561 789.56A391.31 391.31 0 0 1 512 904.534 391.396 391.396 0 0 1 234.44 789.561 391.31 391.31 0 0 1 119.466 512C119.467 403.627 163.413 305.493 234.439 234.44A391.31 391.31 0 0 1 512 119.466ZM714.41 325.177 579.528 456.192 455.253 332.8 196.693 588.117 304.64 697.457 454.969 548.95 578.36 671.46 821.419 435.343 714.41 325.177Z\&quot;></path>&quot;,&quot;#0B69FF&quot;,&quot;&quot;]"></gl-kid-icon>
 *
 * @cssproperty --color - 颜色
 */
export class GlKidIcon {

    /** 尺寸大小 */
    size: string | number | undefined = undefined;

    /** 是否支持夜间模式 */
    darkMode = false; // "supportDarkMode" is a better name

    /** 配置项 */
    config: IIconConfig | undefined = undefined;

    private get type(): EIconType | undefined {
        if (!this.config) return undefined;
        const [type] = this.config;
        return type;
    }

    private get size_(): string | undefined {
        if (!this.size) return;

        if ('number' === typeof this.size) {
            return this.size.toString();
        }

        const sizeNum = Number(this.size);

        if (isNaN(sizeNum)) return this.size;

        if (!sizeNum) return;

        return `${sizeNum}px`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gl-kid-icon': GlKidIcon;
    }
}
