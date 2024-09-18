/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-09-18 14:47:37
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-18 14:49:01
 * @FilePath: \react\packages\react\src\currentBatchConfig.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
interface BatchConfig {
	transition: number | null;
}

const ReactCurrentBatchConfig: BatchConfig = {
	transition: null
};

export default ReactCurrentBatchConfig;
