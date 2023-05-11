import { html, css, unsafeCSS } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import componentStyles from '../styles/component.style';
import GlimmerElement from '../internal/glimmer-element';

import { color_base_black_8 } from '@ks/kwcolor/color/output/all/light.v2';
import common_yoda_nav_back from '@ks/kw/icon/output/common/yoda/common_yoda_nav_back/';

import './kid-icon';

const DEFAULT_BAR_HEIGHT = 28;

function barHeight(): number {
    const ua = navigator.userAgent;
    const barHeightInfo = ua.match(/StatusHT\/\d+/g);
    if (!barHeightInfo?.length) {
        return DEFAULT_BAR_HEIGHT;
    }
    const barHeight = barHeightInfo[0].split('/')[1];
    if (barHeight) {
        return +barHeight;
    } else {
        return DEFAULT_BAR_HEIGHT;
    }
}

const BAR_HEIGHT = barHeight();

/**
 * @summary 快手客户端内标题栏，自适应电池栏高度
 *
 * @example 默认 <gl-title-bar>Title</gl-title-bar>
 * @example 填充右插槽 <gl-title-bar>Title<span slot="right">right</span></gl-title-bar>
 * @example 填充左插槽 <gl-title-bar>Title<span slot="left">left</span></gl-title-bar>
 *
 * @event back - 点击默认的返回按钮，触发此事件
 *
 * @slot - 居中标题
 * @slot left - 左侧区域，默认为返回按钮，点击触发back实践
 * @slot right - 右侧区域
 *
 * @cssproperty --height - 高度
 * @cssproperty --bg-color - 背景色
 * @cssproperty --z-index - zIndex取值，仅在fixed模式下有效
 * @cssproperty --color - 颜色，可继承给左、中、右三个slot内
 */
@customElement('gl-title-bar')
export class GlTitleBar extends GlimmerElement {
    static styles = css`
        ${unsafeCSS(componentStyles)}

        :host {
            display: block;
            --height: 44px;
            --bg-color: #fff;
            --z-index: 10000;
        }

        .fixed-placeholder {
            padding-top: var(--height);
        }

        .h5-header {
            color: var(--color);
            background-color: var(--bg-color);
        }

        .h5-header__content {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: var(--height);
        }

        .h5-header--fixed {
            position: fixed;
            top: 0;
            z-index: var(--z-index);
            width: 100%;
        }

        .h5-header__left {
            position: absolute;
            left: 11px;
            display: flex;
            align-items: center;
        }

        .kid-icon {
            --color: var(--color);
        }

        .h5-header__title {
            font-weight: 600;
            font-size: 17px;
            line-height: 21px;
        }

        .h5-header__right {
            position: absolute;
            right: 19px;
        }
    `;

    /** 是否固定在顶部 */
    @property({ type: Boolean, reflect: true })
    fixed = false;

    /** 固定在顶部时，是否不占用垂直空间 */
    @property({ type: Boolean, reflect: true })
    float = false;

    private _handleBack(): void {
        this.emit('back');
    }

    protected override render() {
        return html`
            <style type="text/css">
                :host {
                    --color: ${color_base_black_8};
                }
            </style>
            <header
                class=${classMap({
                    'h5-header': true,
                    'h5-header--fixed': this.fixed,
                })}
                style=${styleMap({
                    paddingTop: `${BAR_HEIGHT}px`,
                })}
            >
                <div class="h5-header__content">
                    <div class="h5-header__left">
                        <slot name="left">
                            <gl-kid-icon
                                class="kid-icon"
                                config=${JSON.stringify(common_yoda_nav_back)}
                                size="40"
                                @click=${this._handleBack}
                            >
                            </gl-kid-icon>
                        </slot>
                    </div>
                    <div class="h5-header__title">
                        <slot></slot>
                    </div>
                    <div class="h5-header__right">
                        <slot name="right"></slot>
                    </div>
                </div>
                <slot name="fixed"></slot>
            </header>
            ${when(
                this.fixed && !this.float,
                () => html`<div
                    class="fixed-placeholder"
                    style=${styleMap({
                        marginTop: `${BAR_HEIGHT}px`,
                    })}
                >
                    <slot name="fixed-placeholder"></slot>
                </div>`
            )}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gl-title-bar': GlTitleBar;
    }
}
