import { html, type CSSResultGroup } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import GlimmerElement from '../internal/glimmer-element';
import styles from './switch/switch.style';

export interface SwitchProps {
    value: boolean | string;
    disabled: boolean;
    checked: boolean;
}

/**
 * @summary 开关
 *
 * @example 默认开启 <gl-switch checked></gl-switch>
 * @example 默认关闭 <gl-switch></gl-switch>
 * @example 默认禁用 <gl-switch disabled></gl-switch>
 * @example 样式设置 <gl-switch style="--width: 100px;--thumb-size: 25px;--color-active: green;--color-disabled: black"></gl-switch>
 *
 * @event change - 组件状态发生改变，触发此事件
 *
 * @cssproperty --width - 宽度
 * @cssproperty --height - 高度
 * @cssproperty --thumb-size - 按钮的宽度
 * @cssproperty --color-disabled - 按钮关闭状态的颜色
 * @cssproperty --color-active - 按钮打开状态的颜色
 */
@customElement('gl-switch')
export class GlSwitch extends GlimmerElement implements SwitchProps {
    static styles: CSSResultGroup = styles;

    // /** 组件作用表单时的值 */
    @property({ reflect: true }) value = true;

    /** 禁用此组件，不会抛出change事件，但是click事件依旧生效 */
    @property({ type: Boolean, reflect: true }) disabled = false;

    /** 组件初始状态 */
    @property({ type: Boolean, reflect: true }) checked = false;

    private handleChange(e: Event) {
        // This is not necessary cause e.composed is false, just in case.
        e.stopPropagation();
        this.checked = !this.checked;
        this.emit('change');
    }

    protected override render() {
        return html`
            <label
                class=${classMap({
            'gl-switch': true,
            'gl-switch--checked': this.checked,
        })}
            >
                <input
                    class="gl-switch__input"
                    type="checkbox"
                    value=${ifDefined(this.value)}
                    .checked=${live(this.checked)}
                    .disabled=${this.disabled}
                    @change=${this.handleChange}
                />
                <span class="gl-switch__control">
                    <span class="gl-switch__thumb"></span>
                </span>
            </label>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gl-switch': GlSwitch;
    }
}
