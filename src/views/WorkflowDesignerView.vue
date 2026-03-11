<template>
  <div class="h-full w-full flex flex-col bg-slate-50">
    <!-- Header: Tabs and Actions -->
    <div class="bg-white border-b border-gray-200 shadow-sm">
        <!-- Top Row: Breadcrumb / Title -->
        <div class="h-10 px-4 flex items-center justify-between border-b border-gray-100">
             <div class="flex items-center text-xs text-gray-500 space-x-2">
                 <span>工作流</span>
                 <span>/</span>
                 <!-- Editable Workflow Name -->
                 <input 
                   v-model="workflowName" 
                   class="text-blue-600 font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 -mx-1"
                   :class="{ 'cursor-default': isReadOnly }"
                   :readonly="isReadOnly"
                   placeholder="Untitled Workflow"
                 />
             </div>
             <div class="text-xs text-gray-400">
                 {{ isSaving ? '保存中...' : (lastSaved ? `已保存 ${lastSaved}` : '未保存') }}
             </div>
        </div>
        
        <!-- Bottom Row: Tools -->
        <div class="h-12 px-4 flex items-center justify-between">
            <div class="flex items-center space-x-1">
                 <!-- Left side placeholder or empty if no tabs needed -->
            </div>
            
            <div class="flex items-center space-x-2">
                <!-- User Requested Toolbar Buttons -->
                <button title="Basic Info" class="p-2 text-gray-500 hover:bg-gray-100 rounded" @click="togglePanel('info')">
                   <Info class="w-4 h-4" />
                </button>
                <button title="Global Variables" class="p-2 text-gray-500 hover:bg-gray-100 rounded" @click="togglePanel('vars')">
                   <Globe class="w-4 h-4" />
                </button>
                <button title="Flow Data JSON" class="p-2 text-gray-500 hover:bg-gray-100 rounded" @click="togglePanel('json')">
                   <Code class="w-4 h-4" />
                </button>
                <button title="Operation Record" class="p-2 text-gray-500 hover:bg-gray-100 rounded" @click="togglePanel('history')">
                   <History class="w-4 h-4" />
                </button>
                
                <div class="w-px h-4 bg-gray-300 mx-2"></div>

                <button 
                  title="Toggle Edit Mode" 
                  class="flex items-center px-3 py-1.5 rounded border text-sm transition-colors"
                  :class="isReadOnly ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-200'"
                  @click="isReadOnly = !isReadOnly"
                >
                    <Edit3 class="w-4 h-4 mr-1.5" />
                    {{ isReadOnly ? '只读' : '编辑' }}
                </button>

                <div class="w-px h-4 bg-gray-300 mx-2"></div>
                
                <button 
                  class="flex items-center px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 text-sm transition-colors"
                  @click="handleSaveClick"
                >
                    <Save class="w-4 h-4 mr-1.5" />
                    保存
                </button>
                <button 
                  class="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm text-sm transition-colors"
                  @click="handleCreateTask"
                  :disabled="!workflowId"
                  :title="!workflowId ? '先保存工作流' : ''"
                  :class="{ 'opacity-50 cursor-not-allowed': !workflowId }"
                >
                    <Play class="w-4 h-4 mr-1.5" />
                    创建任务
                </button>
            </div>
        </div>
    </div>
    
    <!-- Canvas Area with Right Panel -->
    <div class="flex-1 flex min-h-0">
      <div class="flex-1 relative overflow-hidden">
        <FlowCanvas ref="flowCanvasRef" :readOnly="isReadOnly" @node-selected="handleNodeSelected" @edge-selected="handleEdgeSelected" @save="handleSaveClick" />
      </div>

      <!-- Right Sidebar -->
      <div v-show="activePanel" class="w-[30rem] bg-white border-l border-gray-200 flex flex-col shadow-lg shrink-0">
          <!-- Sidebar Header -->
          <div class="h-10 border-b border-gray-100 flex items-center justify-between px-4">
              <span class="font-medium text-gray-700 capitalize">{{ panelTitles[activePanel || ''] || activePanel }}</span>
              <button @click="closePanel" class="text-gray-400 hover:text-gray-600">
                  <X class="w-4 h-4" />
              </button>
          </div>
          
          <!-- Content: Info (Basic Info) -->
          <div v-if="activePanel === 'info'" class="flex-1 p-4 overflow-y-auto space-y-4">
              <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-500">工作流名称</label>
                  <input 
                    v-model="workflowName" 
                    class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="请输入工作流名称"
                  />
              </div>
              <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-500">项目</label>
                  <select 
                      v-model="selectedProjectId" 
                      class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                      :disabled="!!workflowId"
                  >
                      <option value="" disabled>请选择项目</option>
                      <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <p v-if="workflowId" class="text-xs text-gray-400 italic">已保存的工作流无法修改项目</p>
              </div>
              <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-500">标签</label>
                  <div class="flex flex-wrap gap-1 mb-2">
                      <span 
                        v-for="(tag, idx) in workflowTags" 
                        :key="idx" 
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600"
                      >
                          {{ tag }}
                          <button @click="removeTag(idx)" class="ml-1 text-blue-400 hover:text-blue-600">×</button>
                      </span>
                  </div>
                  <div class="flex gap-2">
                      <select 
                        v-model="newTag" 
                        class="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="" disabled>请选择标签</option>
                        <option v-for="tag in availableTags" :key="tag" :value="tag">
                            {{ tag }}
                        </option>
                      </select>
                      <button 
                        @click="addTag" 
                        :disabled="!newTag"
                        class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-600 disabled:opacity-50"
                      >
                        添加
                      </button>
                  </div>
                  <div v-if="availableTags.length === 0" class="mt-1 text-xs text-orange-500">
                      未配置标签
                  </div>
              </div>

              <div class="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50/60">
                  <div class="flex items-center justify-between">
                      <label class="text-xs font-medium text-gray-600">可见性配置</label>
                      <span class="text-[11px] text-gray-400">未配置时项目全员可见</span>
                  </div>

                  <div class="space-y-1">
                      <label class="text-xs font-medium text-gray-500">允许角色组</label>
                      <div class="grid grid-cols-2 gap-2">
                          <label
                            v-for="role in visibilityRoleOptions"
                            :key="role"
                            class="flex items-center gap-2 text-xs text-gray-700 border border-gray-200 rounded px-2 py-1.5 bg-white hover:border-blue-300 cursor-pointer"
                          >
                              <input
                                type="checkbox"
                                :checked="visibleRoles.includes(role)"
                                @change="toggleVisibleRole(role)"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{{ getRoleLabel(role) }}</span>
                          </label>
                      </div>
                  </div>

                  <div class="space-y-1">
                      <label class="text-xs font-medium text-gray-500">指定成员</label>
                      <div v-if="!selectedProjectId" class="text-xs text-gray-400">请先选择项目</div>
                      <div v-else>
                          <UserMultiSelect v-model="visibleUserIds" :project-id="selectedProjectId" />
                      </div>
                  </div>

                  <p class="text-[11px] text-gray-500 leading-relaxed">
                      命中任一角色组或被指定成员即可访问；项目 Owner 与工作流创建者始终可见。
                  </p>
              </div>
              
              <!-- Notification Template -->
              <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-500">通知模板</label>
                  <button 
                    @click="openTemplateModal"
                    class="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded text-sm hover:border-blue-400 hover:bg-blue-50/50 transition-colors group"
                  >
                      <span class="text-gray-500 group-hover:text-blue-600 truncate">
                          {{ notifyTemplate ? '已配置自定义模板' : '使用默认模板' }}
                      </span>
                      <Edit3 class="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 shrink-0 ml-2" />
                  </button>
              </div>
          </div>
          

          <!-- Content: Global Variables -->
          <div v-else-if="activePanel === 'vars'" class="flex-1 flex flex-col min-h-0">
              <div class="px-4 pt-3">
                  <div class="flex items-center gap-2 p-1 bg-gray-100 rounded-md">
                      <button
                        type="button"
                        class="px-3 py-1.5 text-xs rounded transition-colors"
                        :class="varsSubPage === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'"
                        @click="varsSubPage = 'global'"
                      >
                          全局变量
                      </button>
                      <button
                        type="button"
                        class="px-3 py-1.5 text-xs rounded transition-colors"
                        :class="varsSubPage === 'workflow-list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'"
                        @click="varsSubPage = 'workflow-list'"
                      >
                          流程参数
                      </button>
                      <button
                        v-if="currentWorkflowParam"
                        type="button"
                        class="px-3 py-1.5 text-xs rounded transition-colors"
                        :class="varsSubPage === 'workflow-detail' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'"
                        @click="varsSubPage = 'workflow-detail'"
                      >
                          参数详情
                      </button>
                  </div>
              </div>

              <div class="flex-1 p-4 overflow-y-auto">
                  <template v-if="varsSubPage === 'global'">
              <div v-if="!selectedProjectId" class="text-sm text-gray-400 text-center py-4">
                  请先选择项目以查看可用参数
              </div>
              <div v-else-if="loadingProjectParams" class="text-center py-4">
                  <Loader2 class="w-6 h-6 animate-spin mx-auto text-blue-500" />
              </div>
              <div v-else-if="projectParams.length === 0" class="text-sm text-gray-400 text-center py-4">
                  暂未定义项目的全局变量
              </div>
              <div v-else class="space-y-4">
                  <p class="text-xs text-gray-500 mb-2">Enable parameters to inject into this workflow.</p>
                  
                  <!-- Always Visible Project ID -->
                  <div class="flex items-start gap-2 p-2 rounded bg-gray-50 border border-gray-100 opacity-75">
                      <input type="checkbox" checked disabled class="mt-1 rounded border-gray-300 text-blue-600 bg-gray-100" />
                      <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                             <span class="text-sm font-medium text-gray-700">project_id</span>
                             <span class="text-xs font-mono text-gray-500">{{ selectedProjectId }}</span>
                          </div>
                          <p class="text-xs text-gray-400 mt-0.5">Fixed Project ID</p>
                      </div>
                  </div>

                  <div v-for="param in projectParams" :key="param.key" class="flex items-start gap-2 p-2 rounded border transition-colors" :class="isParamEnabled(param.key) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'">
                      <input 
                        type="checkbox" 
                        :checked="isParamEnabled(param.key)" 
                        @change="toggleParam(param.key)"
                        class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                             <span class="text-sm font-medium text-gray-700 break-all">{{ param.key }}</span>
                             <span class="text-xs font-mono text-gray-500 truncate max-w-[80px]" :title="param.value">{{ param.value }}</span>
                          </div>
                          <p class="text-xs text-gray-500 mt-0.5 break-words">{{ param.description || 'No description' }}</p>
                      </div>
                  </div>
              </div>

              <!-- Separator -->
              <div class="border-t border-gray-200 my-4"></div>

              <!-- Component Output Params (Discovered) -->
              <div>
                  <div class="flex items-center justify-between mb-2">
                       <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wider">上下文输出变量</h4>
                       <button @click="refreshComponentVars" class="text-xs text-blue-600 hover:text-blue-800" title="刷新">
                           <History class="w-3 h-3" />
                       </button>
                  </div>
                  <p class="text-xs text-gray-500 mb-3">节点输出已映射到上下文的变量，可在其他节点中通过 <code class="bg-gray-100 px-1 rounded">${变量名}</code> 引用。</p>

                  <div v-if="componentVars.length === 0" class="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                      <span class="text-xs text-gray-400">暂无配置的输出变量</span>
                      <p class="text-xs text-gray-400 mt-1">请在节点配置面板中设置"输出变量映射"</p>
                  </div>

                  <div v-else class="space-y-2 mb-4">
                       <div v-for="(v, index) in componentVars" :key="index" class="p-2 rounded border border-green-100 bg-green-50">
                           <div class="flex items-center justify-between">
                               <span class="text-xs font-medium text-green-700 font-mono">${{ v.key }}</span>
                               <span class="text-xs text-gray-400 italic">{{ v.component }}</span>
                           </div>
                           <p class="text-xs text-green-800/60 mt-0.5">来源: {{ v.sourceNode }}</p>
                       </div>
                  </div>
              </div>

              <!-- Separator -->
              <div class="border-t border-gray-200 my-4"></div>

              <!-- Component Input References (Discovered) -->
              <div>
                  <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">引用的变量</h4>
                  <p class="text-xs text-gray-500 mb-3">节点输入中使用的 SPLICE 变量引用</p>

                  <div v-if="referencedVars.length === 0" class="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                      <span class="text-xs text-gray-400">暂无变量引用</span>
                  </div>

                  <div v-else class="space-y-2 mb-4">
                       <div v-for="(v, index) in referencedVars" :key="'ref-'+index" class="p-2 rounded border border-orange-100 bg-orange-50">
                           <div class="flex items-center justify-between">
                               <span class="text-xs font-medium text-orange-700 font-mono">${{ v.key }}</span>
                           </div>
                           <p class="text-xs text-orange-800/60 mt-0.5">使用于 {{ v.component }}</p>
                       </div>
                  </div>
              </div>

              <!-- Separator -->
              <div class="border-t border-gray-200 my-4"></div>
              
              <!-- Workflow Specific Params -->
              </template>

              <template v-else-if="varsSubPage === 'workflow-list'">
              <div>
                  <div class="flex items-center justify-between mb-2">
                      <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wider">流程变量</h4>
                      <button @click="addWorkflowParam" class="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                          + 新增
                      </button>
                  </div>
                  <p class="text-xs text-gray-500 mb-3">主列表仅显示参数名称，点击后在详情页编辑类型、默认值与描述。</p>

                  <div v-if="workflowParams.length === 0" class="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                      <span class="text-xs text-gray-400">暂无流程参数</span>
                  </div>

                  <div v-else class="space-y-2">
                      <div
                        v-for="(param, index) in workflowParams"
                        :key="index"
                        class="flex items-center gap-2"
                      >
                          <button
                            type="button"
                            class="flex-1 text-left rounded border px-2 py-1.5 text-xs transition-colors"
                            :class="selectedWorkflowParamIndex === index ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white hover:border-blue-300'"
                            @click="openWorkflowParamDetail(index)"
                          >
                              <span class="font-mono">{{ getWorkflowParamDisplayName(param, index) }}</span>
                          </button>
                          <button @click="removeWorkflowParam(index)" class="text-gray-400 hover:text-red-500">
                              <X class="w-3 h-3" />
                          </button>
                      </div>
                  </div>
              </div>
              </template>

              <template v-else>
              <div v-if="currentWorkflowParam" class="space-y-3">
                  <div class="flex items-center justify-between">
                      <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wider">参数详情</h4>
                      <button type="button" class="text-xs text-blue-600 hover:text-blue-700" @click="closeWorkflowParamDetail">
                          返回参数列表
                      </button>
                  </div>

                  <div class="space-y-1">
                      <label class="text-[11px] font-medium text-gray-500">参数名称</label>
                      <input
                        v-model="currentWorkflowParam.key"
                        placeholder="例如：target_branch"
                        class="w-full text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                      />
                  </div>

                  <div class="space-y-1">
                      <label class="text-[11px] font-medium text-gray-500">参数类型</label>
                      <select
                        v-model="currentWorkflowParam.input_type"
                        class="w-full text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none bg-white"
                        @change="onWorkflowParamTypeChange(currentWorkflowParam)"
                      >
                          <option v-for="item in workflowParamTypes" :key="item.value" :value="item.value">
                              {{ item.label }}
                          </option>
                      </select>
                  </div>

                  <div class="space-y-1">
                      <label class="text-[11px] font-medium text-gray-500">描述</label>
                      <textarea
                        v-model="currentWorkflowParam.description"
                        rows="2"
                        placeholder="参数用途说明（可选）"
                        class="w-full text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                      ></textarea>
                  </div>

                  <template v-if="currentWorkflowParam.input_type === 'git-branch'">
                      <div class="space-y-1">
                          <label class="text-[11px] font-medium text-gray-500">仓库地址</label>
                          <input
                            v-model="currentWorkflowParam.git_branch.repo_url"
                            placeholder="https://github.com/org/repo 或 https://gitlab.example.com/group/repo"
                            class="w-full text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                          />
                      </div>
                      <div class="space-y-1">
                          <label class="text-[11px] font-medium text-gray-500">仓库 Token</label>
                          <input
                            v-model="currentWorkflowParam.git_branch.token"
                            type="password"
                            placeholder="用于拉取分支列表"
                            class="w-full text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                          />
                      </div>
                      <div class="space-y-1">
                          <label class="text-[11px] font-medium text-gray-500">默认值（分支）</label>
                          <input
                            v-model="currentWorkflowParam.value"
                            placeholder="例如：main"
                            class="w-full text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                          />
                      </div>
                  </template>

                  <template v-else-if="currentWorkflowParam.input_type === 'single-select' || currentWorkflowParam.input_type === 'multi-select'">
                      <div class="space-y-2">
                          <div class="flex items-center justify-between">
                              <label class="text-[11px] font-medium text-gray-500">选项</label>
                              <button
                                type="button"
                                class="text-[11px] text-blue-600 hover:text-blue-700"
                                @click="addWorkflowParamOption(currentWorkflowParam)"
                              >
                                  + 新增选项
                              </button>
                          </div>
                          <div v-if="currentWorkflowParam.options.length === 0" class="text-[11px] text-orange-500">
                              请至少添加一个选项
                          </div>
                          <div v-else class="space-y-2">
                              <div
                                v-for="(opt, optIndex) in currentWorkflowParam.options"
                                :key="optIndex"
                                class="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                              >
                                  <input
                                    v-model="opt.value"
                                    placeholder="value"
                                    class="text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                                  />
                                  <input
                                    v-model="opt.label"
                                    placeholder="显示值"
                                    class="text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    class="text-gray-400 hover:text-red-500"
                                    @click="removeWorkflowParamOption(currentWorkflowParam, optIndex)"
                                  >
                                      <X class="w-3 h-3" />
                                  </button>
                              </div>
                          </div>
                      </div>

                      <div v-if="currentWorkflowParam.input_type === 'single-select'" class="space-y-1">
                          <label class="text-[11px] font-medium text-gray-500">默认值</label>
                          <select
                            v-model="currentWorkflowParam.value"
                            class="w-full text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none bg-white"
                          >
                              <option value="">请选择默认值</option>
                              <option
                                v-for="(opt, optIndex) in currentWorkflowParam.options"
                                :key="`single-${optIndex}`"
                                :value="opt.value"
                              >
                                  {{ opt.label || opt.value }}
                              </option>
                          </select>
                      </div>

                      <div v-else class="space-y-1">
                          <label class="text-[11px] font-medium text-gray-500">默认值（可多选）</label>
                          <div class="space-y-1">
                              <label
                                v-for="(opt, optIndex) in currentWorkflowParam.options"
                                :key="`multi-${optIndex}`"
                                class="flex items-center gap-2 text-xs text-gray-700"
                              >
                                  <input
                                    type="checkbox"
                                    :checked="isMultiDefaultSelected(currentWorkflowParam, opt.value)"
                                    @change="toggleMultiDefaultValue(currentWorkflowParam, opt.value)"
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{{ opt.label || opt.value }}</span>
                              </label>
                          </div>
                      </div>
                  </template>

                  <template v-else-if="currentWorkflowParam.input_type === 'toggle'">
                      <div class="space-y-1">
                          <label class="text-[11px] font-medium text-gray-500">默认值</label>
                          <label class="inline-flex items-center gap-2 rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700">
                              <input
                                v-model="currentWorkflowParam.value"
                                type="checkbox"
                                :true-value="1"
                                :false-value="0"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{{ Number(currentWorkflowParam.value) === 1 ? '开启 (1)' : '关闭 (0)' }}</span>
                          </label>
                      </div>
                  </template>

                  <template v-else>
                      <div class="space-y-1">
                          <label class="text-[11px] font-medium text-gray-500">默认值</label>
                          <input
                            v-model="currentWorkflowParam.value"
                            placeholder="默认值"
                            class="w-full text-xs border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                          />
                      </div>
                  </template>
              </div>
              <div v-else class="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded border border-dashed border-gray-200">
                  请先在流程参数页选择一个参数
              </div>
              </template>
          </div>
          </div>
          
          <!-- Content: JSON -->
          <div v-else-if="activePanel === 'json'" class="flex-1 p-4 overflow-y-auto space-y-3">
              <div class="flex items-center justify-between gap-2">
                  <p class="text-xs text-gray-500 leading-relaxed">
                      可拷贝当前流程数据，也可以直接粘贴 JSON 后导入到画布。
                  </p>
                  <div class="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        class="px-3 py-1.5 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        @click="copyFlowData"
                      >
                          拷贝
                      </button>
                      <button
                        type="button"
                        class="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="isReadOnly"
                        @click="importFlowData"
                      >
                          导入
                      </button>
                  </div>
              </div>

              <p
                v-if="jsonFeedback"
                class="text-xs"
                :class="jsonFeedbackType === 'error' ? 'text-red-500' : 'text-emerald-600'"
              >
                  {{ jsonFeedback }}
              </p>

              <textarea
                v-model="jsonDraft"
                class="w-full min-h-[24rem] px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 leading-relaxed"
                :readonly="isReadOnly"
                spellcheck="false"
                placeholder="在这里查看、拷贝或粘贴流程 JSON"
              ></textarea>
          </div>
          
          <!-- ... remaining panels ... -->
          <div v-else-if="activePanel === 'configuration'" class="flex-1 h-full overflow-hidden">
              <NodeConfiguration 
                  v-if="selectedNode" 
                  :node="selectedNode" 
                  :project-id="selectedProjectId || undefined"
              />
              <div v-else class="text-sm text-gray-400 text-center py-10">
                  Select a node to configure.
              </div>
          </div>

          <!-- Content: Edge Configuration -->
          <div v-else-if="activePanel === 'edge-configuration'" class="flex-1 h-full overflow-hidden">
              <EdgeConfiguration 
                  v-if="selectedEdge" 
                  :edge="selectedEdge" 
              />
              <div v-else class="text-sm text-gray-400 text-center py-10">
                  Select a line to configure.
              </div>
          </div>
          
          <!-- Default Placeholder -->
          <div v-else class="flex-1 p-4 overflow-y-auto text-sm text-gray-500">
              Placeholder for {{ activePanel }} content.
          </div>
      </div>
    </div>
    
    <!-- Notification Template Modal -->
    <div v-if="showTemplateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="cancelTemplateModal">
        <div class="bg-white rounded-lg shadow-xl w-[840px] max-h-[80vh] flex flex-col">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">编辑通知模板</h3>
                <button @click="cancelTemplateModal" class="text-gray-400 hover:text-gray-600">
                    <X class="w-5 h-5" />
                </button>
            </div>
            <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                    <label class="text-sm font-medium text-gray-700 mb-1.5 block">模板内容</label>
                    <p class="text-xs text-gray-400 mb-2">留空则使用默认模板。任务完成/失败/撤销时将按此模板发送通知。</p>
                    <textarea 
                      v-model="templateDraft" 
                      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono leading-relaxed"
                      rows="8"
                      placeholder="例如：&#10;${status_emoji} 任务 ${task_name} ${status_label}&#10;&#10;下载地址: ${build_android_result[&quot;apk_download_url&quot;]}&#10;分支: ${branch}"
                    ></textarea>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">可用变量</h4>
                    <div class="grid grid-cols-2 gap-2 text-xs" v-pre>
                        <div class="flex items-center gap-2">
                            <code class="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-blue-600">${task_name}</code>
                            <span class="text-gray-500">任务名称</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <code class="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-blue-600">${status}</code>
                            <span class="text-gray-500">原始状态</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <code class="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-blue-600">${status_label}</code>
                            <span class="text-gray-500">中文状态</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <code class="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-blue-600">${status_emoji}</code>
                            <span class="text-gray-500">状态图标</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <code class="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-blue-600">${workflow_name}</code>
                            <span class="text-gray-500">工作流名称</span>
                        </div>
                        <div class="flex items-center gap-2 col-span-2 pt-2 border-t border-gray-200 mt-1">
                            <code class="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-green-600">${变量名}</code>
                            <span class="text-gray-500">运行时参数与流程变量均可直接通过变量名引用</span>
                        </div>
                        <div class="flex items-center gap-2 col-span-2 pt-2 border-t border-gray-200 mt-1">
                            <code class="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-purple-600">${build_android_result["apk_download_url"]}</code>
                            <span class="text-gray-500">支持对象/数组下标访问，语法与 bamboo splice 一致</span>
                        </div>
                    </div>
                </div>
                <div class="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                    <h4 class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">使用说明</h4>
                    <ul class="text-xs text-gray-600 space-y-1.5 list-disc list-inside" v-pre>
                        <li><b>模板语法</b>：仅支持 <code class="text-green-600">${...}</code>，不支持 <code class="text-red-600">{{...}}</code></li>
                        <li><b>变量引用</b>：直接使用变量名，如 <code class="text-purple-600">${branch}</code>、<code class="text-purple-600">${news}</code></li>
                        <li><b>下标访问</b>：支持 <code class="text-purple-600">${obj["key"]}</code>、<code class="text-purple-600">${arr[0]}</code></li>
                        <li>留空则使用默认模板，仅显示任务状态信息</li>
                    </ul>
                </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <button 
                  v-if="templateDraft"
                  @click="templateDraft = ''" 
                  class="text-xs text-red-500 hover:text-red-700"
                >清空模板（使用默认）</button>
                <span v-else></span>
                <div class="flex space-x-3">
                    <button @click="cancelTemplateModal" class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md">
                        取消
                    </button>
                    <button @click="saveTemplateModal" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                        确定
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Save Modal -->
    <div v-if="showSaveModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showSaveModal = false">
        <div class="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">保存工作流</h3>
            <div class="space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-medium text-gray-500">工作流名称</label>
                    <input 
                      v-model="workflowName" 
                      class="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                      placeholder="请输入工作流名称"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
                    <select v-model="selectedProjectId" class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="" disabled>请选择项目</option>
                        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
                <div class="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                    <label class="block text-xs font-medium text-gray-600">可见性配置（可选）</label>
                    <div class="grid grid-cols-2 gap-2">
                        <label
                          v-for="role in visibilityRoleOptions"
                          :key="'save-modal-' + role"
                          class="flex items-center gap-2 text-xs text-gray-700 border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer"
                        >
                            <input
                              type="checkbox"
                              :checked="visibleRoles.includes(role)"
                              @change="toggleVisibleRole(role)"
                              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{{ getRoleLabel(role) }}</span>
                        </label>
                    </div>
                    <div>
                        <div v-if="!selectedProjectId" class="text-xs text-gray-400">请先选择项目</div>
                        <UserMultiSelect v-else v-model="visibleUserIds" :project-id="selectedProjectId" />
                    </div>
                    <p class="text-[11px] text-gray-500">
                        不配置时项目成员全员可见；命中任一角色或指定成员即可访问。
                    </p>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button @click="showSaveModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md">
                        取消
                    </button>
                    <button 
                        @click="handleSave" 
                        :disabled="isSaving || !workflowName"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                    >
                        {{ isSaving ? '保存中...' : '保存' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FlowCanvas from '../components/FlowCanvas.vue'
import NodeConfiguration from '../components/NodeConfiguration.vue'
import EdgeConfiguration from '../components/EdgeConfiguration.vue'
import UserMultiSelect from '../components/node-params/inputs/UserMultiSelect.vue'
import { Save, Play, Info, Globe, Code, History, Edit3, X, Loader2 } from 'lucide-vue-next'
import axios from 'axios'
import { buildPipelineTree, validatePipelineTree, type BuildPipelineOptions, type ParamDefinition } from '../utils/pipelineTreeBuilder'

const route = useRoute()
const router = useRouter()
const flowCanvasRef = ref<InstanceType<typeof FlowCanvas> | null>(null)

const activePanel = ref<string | null>(null)
const isReadOnly = ref(false)
const selectedNode = ref<any>(null)
const selectedEdge = ref<any>(null)
const graphData = ref<any>({}) // Placeholder for JSON view

// ... (skipping unchanged parts) ...

const panelTitles: Record<string, string> = {
    info: '基础信息',
    vars: '全局变量',
    json: '流程数据',
    history: '操作记录',
    configuration: '节点配置',
    'edge-configuration': '边配置'
}

// Workflow state
const workflowId = ref<string | null>(null)
const workflowName = ref('Untitled Workflow')
const workflowTags = ref<string[]>([])
const newTag = ref('')
const selectedProjectId = ref<number | string>('')
const projects = ref<{id: number, name: string}[]>([])
const projectMembers = ref<Array<{ user: number; username: string; role: string }>>([])
const loadingProjectMembers = ref(false)
const visibilityRoleOptions = ['OWNER', 'MAINTAINER', 'DEVELOPER', 'REPORTER'] as const
const visibleRoles = ref<string[]>([])
const visibleUserIds = ref<number[]>([])
const isLoading = ref(false)
const notifyTemplate = ref('')
const showTemplateModal = ref(false)
const templateDraft = ref('')
const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/

const isValidIdentifier = (value: string): boolean => {
    return IDENTIFIER_REGEX.test((value || '').trim())
}

const openTemplateModal = () => {
    templateDraft.value = notifyTemplate.value
    showTemplateModal.value = true
}
const cancelTemplateModal = () => {
    showTemplateModal.value = false
}
const saveTemplateModal = () => {
    if (templateDraft.value.includes('{{') || templateDraft.value.includes('}}')) {
        alert('通知模板仅支持 ${...} 语法，不支持 {{...}}。')
        return
    }
    notifyTemplate.value = templateDraft.value
    showTemplateModal.value = false
}

// Global Params State
interface ProjectParam {
    key: string
    value: string
    description: string
}
const projectParams = ref<ProjectParam[]>([])
const loadingProjectParams = ref(false)
const enabledGlobalParams = ref<string[]>([])
type VarsSubPage = 'global' | 'workflow-list' | 'workflow-detail'
const varsSubPage = ref<VarsSubPage>('global')

const availableTags = ref<string[]>([])

const roleLabelMap: Record<string, string> = {
    OWNER: 'Owner',
    MAINTAINER: 'Maintainer',
    DEVELOPER: 'Developer',
    REPORTER: 'Reporter',
}

const getRoleLabel = (role: string) => roleLabelMap[role] || role

const toggleVisibleRole = (role: string) => {
    const idx = visibleRoles.value.indexOf(role)
    if (idx >= 0) {
        visibleRoles.value.splice(idx, 1)
    } else {
        visibleRoles.value.push(role)
    }
}

const fetchProjectMembers = async () => {
    if (!selectedProjectId.value) {
        projectMembers.value = []
        visibleUserIds.value = []
        return
    }

    loadingProjectMembers.value = true
    try {
        const resp = await axios.get(`/api/projects/members/?project_id=${selectedProjectId.value}`)
        const data = resp.data.results || resp.data || []
        projectMembers.value = data.map((m: any) => ({
            user: m.user,
            username: m.username,
            role: m.role
        }))
        const validIds = new Set(projectMembers.value.map((m) => m.user))
        visibleUserIds.value = visibleUserIds.value.filter((id) => validIds.has(id))
    } catch (e) {
        console.error('Failed to fetch project members', e)
        projectMembers.value = []
        visibleUserIds.value = []
    } finally {
        loadingProjectMembers.value = false
    }
}

const fetchProjectParams = async () => {
    if (!selectedProjectId.value) {
        projectParams.value = []
        availableTags.value = []
        return
    }
    loadingProjectParams.value = true
    try {
        const { data } = await axios.get(`/api/projects/${selectedProjectId.value}/`)
        // Global Params
        if (data.extra_config && data.extra_config.global_params) {
            projectParams.value = data.extra_config.global_params
        } else {
             projectParams.value = []
        }
        // Workflow Tags
        if (data.extra_config && data.extra_config.workflow_tags) {
            availableTags.value = data.extra_config.workflow_tags
        } else {
            availableTags.value = []
        }
    } catch (e) {
        console.error("Failed to load project params", e)
    } finally {
        loadingProjectParams.value = false
    }
}

// Watch activePanel to load params when 'vars' opens.
// Also watch selectedProjectId.
watch(activePanel, (newVal, oldVal) => {
    if (newVal === 'vars' || newVal === 'info') {
        fetchProjectParams()
    }
    if (newVal === 'vars') {
        if (oldVal !== 'vars') {
            varsSubPage.value = 'global'
        }
        // Wait for graph to be ready/loaded before checking
        nextTick(() => {
            refreshComponentVars()
        })
    }
    if (newVal === 'json') {
        syncJsonDraft()
        jsonFeedback.value = ''
    }
})
watch(selectedProjectId, () => {
    fetchProjectMembers()
    if (activePanel.value === 'vars' || activePanel.value === 'info') {
        fetchProjectParams()
    }
})

const isParamEnabled = (key: string) => {
    return enabledGlobalParams.value.includes(key)
}

const toggleParam = (key: string) => {
    const idx = enabledGlobalParams.value.indexOf(key)
    if (idx === -1) {
        enabledGlobalParams.value.push(key)
    } else {
        enabledGlobalParams.value.splice(idx, 1)
    }
}

// Workflow Local Params State
type WorkflowParamInputType = 'text' | 'git-branch' | 'single-select' | 'multi-select' | 'toggle'

interface WorkflowParamOption {
    value: string
    label: string
}

interface WorkflowParamGitBranchConfig {
    repo_url: string
    token: string
}

interface WorkflowParam {
    key: string
    value: any
    description: string
    input_type: WorkflowParamInputType
    options: WorkflowParamOption[]
    git_branch: WorkflowParamGitBranchConfig
}

const workflowParamTypes: Array<{ value: WorkflowParamInputType; label: string }> = [
    { value: 'text', label: '文本' },
    { value: 'git-branch', label: 'Git 分支' },
    { value: 'single-select', label: '单选' },
    { value: 'multi-select', label: '多选' },
    { value: 'toggle', label: '开关' },
]

const createDefaultWorkflowParam = (): WorkflowParam => ({
    key: '',
    value: '',
    description: '',
    input_type: 'text',
    options: [],
    git_branch: {
        repo_url: '',
        token: '',
    },
})

const normalizeToggleValue = (value: any): 0 | 1 => {
    if (value === 1 || value === '1' || value === true) {
        return 1
    }

    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'true' || normalized === 'yes' || normalized === 'on' ? 1 : 0
}

const normalizeWorkflowParam = (raw: any): WorkflowParam => {
    const normalizedType: WorkflowParamInputType = workflowParamTypes.some((x) => x.value === raw?.input_type)
        ? raw.input_type
        : 'text'

    const options: WorkflowParamOption[] = Array.isArray(raw?.options)
        ? raw.options.map((opt: any) => ({
            value: String(opt?.value ?? '').trim(),
            label: String(opt?.label ?? opt?.value ?? '').trim(),
        }))
        : []

    let normalizedValue: any = raw?.value ?? ''
    if (normalizedType === 'multi-select') {
        normalizedValue = Array.isArray(raw?.value) ? raw.value.map((v: any) => String(v)) : []
    } else if (normalizedType === 'toggle') {
        normalizedValue = normalizeToggleValue(raw?.value)
    } else {
        normalizedValue = String(raw?.value ?? '')
    }

    return {
        key: String(raw?.key ?? ''),
        value: normalizedValue,
        description: String(raw?.description ?? ''),
        input_type: normalizedType,
        options,
        git_branch: {
            repo_url: String(raw?.git_branch?.repo_url ?? ''),
            token: String(raw?.git_branch?.token ?? ''),
        },
    }
}

const workflowParams = ref<WorkflowParam[]>([])
const selectedWorkflowParamIndex = ref<number | null>(null)

const currentWorkflowParam = computed<WorkflowParam | null>(() => {
    if (selectedWorkflowParamIndex.value === null) {
        return null
    }
    return workflowParams.value[selectedWorkflowParamIndex.value] || null
})

const jsonDraft = ref('')
const jsonFeedback = ref('')
const jsonFeedbackType = ref<'success' | 'error'>('success')

const getWorkflowParamDisplayName = (param: WorkflowParam, index: number) => {
    const key = String(param.key || '').trim()
    return key || `param_${index + 1}`
}

const openWorkflowParamDetail = (index: number) => {
    selectedWorkflowParamIndex.value = index
    varsSubPage.value = 'workflow-detail'
}

const closeWorkflowParamDetail = () => {
    selectedWorkflowParamIndex.value = null
    varsSubPage.value = 'workflow-list'
}

const onWorkflowParamTypeChange = (param: WorkflowParam) => {
    if (!param.git_branch) {
        param.git_branch = { repo_url: '', token: '' }
    }
    if (!Array.isArray(param.options)) {
        param.options = []
    }

    if (param.input_type === 'multi-select') {
        if (!Array.isArray(param.value)) {
            param.value = []
        }
        const validValues = new Set(param.options.map((opt) => String(opt.value || '').trim()).filter(Boolean))
        param.value = param.value.map((v: any) => String(v)).filter((v: string) => validValues.has(v))
        return
    }

    if (param.input_type === 'toggle') {
        param.value = normalizeToggleValue(param.value)
        return
    }

    if (Array.isArray(param.value)) {
        param.value = ''
    } else {
        param.value = String(param.value ?? '')
    }

    if (param.input_type === 'single-select' && param.value) {
        const validValues = new Set(param.options.map((opt) => String(opt.value || '').trim()).filter(Boolean))
        if (!validValues.has(param.value)) {
            param.value = ''
        }
    }
}

const addWorkflowParamOption = (param: WorkflowParam) => {
    param.options.push({
        value: '',
        label: '',
    })
}

const removeWorkflowParamOption = (param: WorkflowParam, index: number) => {
    param.options.splice(index, 1)
    onWorkflowParamTypeChange(param)
}

const isMultiDefaultSelected = (param: WorkflowParam, value: string) => {
    return Array.isArray(param.value) && param.value.includes(value)
}

const toggleMultiDefaultValue = (param: WorkflowParam, value: string) => {
    const arr = Array.isArray(param.value) ? [...param.value] : []
    const idx = arr.indexOf(value)
    if (idx >= 0) {
        arr.splice(idx, 1)
    } else {
        arr.push(value)
    }
    param.value = arr
}

const addWorkflowParam = () => {
    workflowParams.value.push(createDefaultWorkflowParam())
    selectedWorkflowParamIndex.value = workflowParams.value.length - 1
    varsSubPage.value = 'workflow-detail'
}

const removeWorkflowParam = (index: number) => {
    workflowParams.value.splice(index, 1)
    if (selectedWorkflowParamIndex.value === null) {
        return
    }
    if (selectedWorkflowParamIndex.value === index) {
        selectedWorkflowParamIndex.value = null
        if (varsSubPage.value === 'workflow-detail') {
            varsSubPage.value = 'workflow-list'
        }
    } else if (selectedWorkflowParamIndex.value > index) {
        selectedWorkflowParamIndex.value -= 1
    }
}

// Save state
const showSaveModal = ref(false)
const isSaving = ref(false)
const lastSaved = ref('')

// Create Task state
const showCreateTaskModal = ref(false)

// Discovered Component Output Vars
interface ComponentVar {
    key: string
    component: string
    sourceNode: string
}
const componentVars = ref<ComponentVar[]>([])
const referencedVars = ref<ComponentVar[]>([])

const refreshComponentVars = () => {
    componentVars.value = []
    referencedVars.value = []
    
    if (!flowCanvasRef.value) return

    const graph = flowCanvasRef.value.getGraph()
    if (!graph) return

    const nodes = graph.getNodes()
    nodes.forEach((node: any) => {
        const data = node.getData()
        if (!data) return
        
        // Find Produced Vars from outputs array
        // Format: outputs: [{ sourceKey: 'result', contextKey: 'ai_response' }]
        if (Array.isArray(data.outputs)) {
            data.outputs.forEach((out: { sourceKey: string; contextKey: string }) => {
                if (out.sourceKey && out.contextKey) {
                    componentVars.value.push({
                        key: out.contextKey,
                        component: data.label || 'Unknown Component',
                        sourceNode: `${node.id} → ${out.sourceKey}`
                    })
                }
            })
        }
        
        // Find Referenced Vars
        // Iterate all inputs
        if (data.inputs) {
            Object.entries(data.inputs).forEach(([k, v]) => {
                if (typeof v === 'string') {
                    const matches = v.match(/\$\{([a-zA-Z0-9_]+)\}/g)
                    if (matches) {
                        matches.forEach(match => {
                            const key = match.substring(2, match.length - 1)
                            referencedVars.value.push({
                                key: key,
                                component: data.label || 'Unknown Component',
                                sourceNode: node.id
                            })
                        })
                    }
                }
            })
        }
    })
}

const handleNodeSelected = (node: any) => {
    selectedNode.value = node
    if (node) {
        selectedEdge.value = null // Only deselect edge if selecting a node
        activePanel.value = 'configuration'
    } else {
        // Only close if it was the active panel
        if (activePanel.value === 'configuration') {
            activePanel.value = null
        }
    }
}

const handleEdgeSelected = (edge: any) => {
    selectedEdge.value = edge
    if (edge) {
        selectedNode.value = null // Only deselect node if selecting an edge
        activePanel.value = 'edge-configuration'
    } else {
        // Only close if it was the active panel
        if (activePanel.value === 'edge-configuration') {
            activePanel.value = null
        }
    }
}

const updateNodeData = () => {
    // Deprecated, handled by NodeConfiguration
}

const closePanel = () => {
    activePanel.value = null
}

const togglePanel = (panel: string) => {
    if (activePanel.value === panel) {
        activePanel.value = null
    } else {
        activePanel.value = panel
    }
}

const addTag = () => {
    const tag = newTag.value.trim()
    if (tag && !workflowTags.value.includes(tag)) {
        workflowTags.value.push(tag)
        newTag.value = ''
    }
}

const removeTag = (idx: number) => {
    workflowTags.value.splice(idx, 1)
}

const fetchProjects = async () => {
    try {
        const resp = await axios.get('/api/projects/')
        projects.value = resp.data.results || resp.data || []
    } catch (e) {
        console.error('Failed to fetch projects:', e)
    }
}

// Handle save button click - skip modal for existing workflows
const handleSaveClick = () => {
    if (workflowId.value) {
        // Existing workflow - save directly
        handleSave()
    } else {
        // New workflow - show modal to select project
        showSaveModal.value = true
    }
}

const normalizeWorkflowParamsForSave = (): WorkflowParam[] => {
    return workflowParams.value.map((raw) => {
        const param = normalizeWorkflowParam(raw)
        param.key = param.key.trim()
        param.description = param.description.trim()
        param.options = param.options
            .map((opt) => ({
                value: String(opt.value || '').trim(),
                label: String(opt.label || opt.value || '').trim(),
            }))
            .filter((opt) => !!opt.value)
        param.git_branch = {
            repo_url: String(param.git_branch?.repo_url || '').trim(),
            token: String(param.git_branch?.token || '').trim(),
        }

        if (param.input_type === 'multi-select') {
            const validValues = new Set(param.options.map((opt) => opt.value))
            const values = Array.isArray(param.value) ? param.value.map((v: any) => String(v)) : []
            param.value = values.filter((v: string) => validValues.has(v))
        } else if (param.input_type === 'toggle') {
            param.value = normalizeToggleValue(param.value)
        } else {
            param.value = String(param.value ?? '')
            if (param.input_type === 'single-select') {
                const validValues = new Set(param.options.map((opt) => opt.value))
                if (param.value && !validValues.has(param.value)) {
                    param.value = ''
                }
            }
        }
        return param
    })
}

const validateWorkflowParamsForSave = (params: WorkflowParam[]): string[] => {
    const errors: string[] = []
    const seen = new Set<string>()

    params.forEach((param, index) => {
        const label = `流程参数 #${index + 1}`

        if (!param.key) {
            errors.push(`${label} 未填写参数名称`)
            return
        }
        if (!isValidIdentifier(param.key)) {
            errors.push(`${label} 参数名称不合法：${param.key}（仅支持字母/数字/下划线，且不能数字开头）`)
            return
        }
        if (seen.has(param.key)) {
            errors.push(`${label} 与其他参数重名：${param.key}`)
            return
        }
        seen.add(param.key)

        if (param.input_type === 'single-select' || param.input_type === 'multi-select') {
            if (!param.options.length) {
                errors.push(`${label}（${param.key}）至少需要一个选项`)
                return
            }
            const optionValues = param.options.map((opt) => opt.value)
            const optionValueSet = new Set(optionValues)
            if (optionValueSet.size !== optionValues.length) {
                errors.push(`${label}（${param.key}）存在重复选项值`)
            }

            if (param.input_type === 'single-select') {
                const value = String(param.value || '')
                if (value && !optionValueSet.has(value)) {
                    errors.push(`${label}（${param.key}）默认值不在选项中`)
                }
            } else {
                const values = Array.isArray(param.value) ? param.value.map((v) => String(v)) : []
                const invalidValues = values.filter((v) => !optionValueSet.has(v))
                if (invalidValues.length) {
                    errors.push(`${label}（${param.key}）多选默认值存在无效选项`)
                }
            }
        }

        if (param.input_type === 'git-branch') {
            if (!param.git_branch.repo_url) {
                errors.push(`${label}（${param.key}）缺少仓库地址`)
            }
            if (!param.git_branch.token) {
                errors.push(`${label}（${param.key}）缺少仓库 Token`)
            }
        }
    })

    return errors
}

const validateOutputMappingKeys = (graph: any): string[] => {
    const errors: string[] = []
    const seen = new Set<string>()

    const nodes = graph?.getNodes?.() || []
    nodes.forEach((node: any) => {
        const data = node?.getData?.() || {}
        const outputs = Array.isArray(data.outputs) ? data.outputs : []
        outputs.forEach((out: any, index: number) => {
            const raw = String(out?.contextKey || '').trim()
            if (!raw) return
            const nodeLabel = data.label || node.id || `node#${index + 1}`
            if (!isValidIdentifier(raw)) {
                errors.push(`${nodeLabel} 输出变量名不合法：${raw}`)
                return
            }
            if (seen.has(raw)) {
                errors.push(`${nodeLabel} 输出变量名重复：${raw}`)
                return
            }
            seen.add(raw)
        })
    })

    return errors
}

const buildCurrentGraphData = (paramsOverride?: WorkflowParam[]) => {
    const graph = flowCanvasRef.value?.getGraph()
    const nextGraphData: any = graph
        ? graph.toJSON()
        : JSON.parse(JSON.stringify(graphData.value || {}))

    nextGraphData.global_params_enabled = [...enabledGlobalParams.value]
    nextGraphData.workflow_params = paramsOverride ?? normalizeWorkflowParamsForSave()

    return nextGraphData
}

const syncJsonDraft = () => {
    const currentGraphData = buildCurrentGraphData()
    graphData.value = currentGraphData
    jsonDraft.value = JSON.stringify(currentGraphData, null, 2)
}

const applyImportedGraphData = async (rawData: any) => {
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
        throw new Error('流程数据必须是 JSON 对象')
    }
    if (!Array.isArray(rawData.cells)) {
        throw new Error('流程数据缺少 cells 数组')
    }

    const normalizedParams = Array.isArray(rawData.workflow_params)
        ? rawData.workflow_params.map((param: any) => normalizeWorkflowParam(param))
        : []

    graphData.value = rawData
    enabledGlobalParams.value = Array.isArray(rawData.global_params_enabled)
        ? rawData.global_params_enabled.map((key: any) => String(key))
        : []
    workflowParams.value = normalizedParams
    selectedWorkflowParamIndex.value = null

    await nextTick()
    if (!flowCanvasRef.value) {
        throw new Error('画布尚未就绪，无法导入')
    }

    flowCanvasRef.value.loadGraph(rawData)
    jsonDraft.value = JSON.stringify(rawData, null, 2)
    jsonFeedbackType.value = 'success'
    jsonFeedback.value = '流程数据已导入到画布，当前改动尚未保存。'
    lastSaved.value = ''

    nextTick(() => {
        refreshComponentVars()
    })
}

const copyFlowData = async () => {
    try {
        syncJsonDraft()
        if (!navigator?.clipboard?.writeText) {
            throw new Error('当前环境不支持剪贴板写入')
        }
        await navigator.clipboard.writeText(jsonDraft.value)
        jsonFeedbackType.value = 'success'
        jsonFeedback.value = '当前流程数据已复制到剪贴板。'
    } catch (e: any) {
        console.error('Failed to copy flow data:', e)
        jsonFeedbackType.value = 'error'
        jsonFeedback.value = `复制失败：${e?.message || '未知错误'}`
    }
}

const importFlowData = async () => {
    if (isReadOnly.value) {
        jsonFeedbackType.value = 'error'
        jsonFeedback.value = '当前为只读模式，切换到编辑后才能导入。'
        return
    }

    try {
        const parsed = JSON.parse(jsonDraft.value)
        await applyImportedGraphData(parsed)
    } catch (e: any) {
        console.error('Failed to import flow data:', e)
        jsonFeedbackType.value = 'error'
        jsonFeedback.value = `导入失败：${e?.message || '请输入合法的流程 JSON'}`
    }
}

const handleSave = async (): Promise<boolean> => {
    if (!workflowName.value) return false
    if (notifyTemplate.value.includes('{{') || notifyTemplate.value.includes('}}')) {
        alert('通知模板仅支持 ${...} 语法，不支持 {{...}}。')
        return false
    }
    
    isSaving.value = true
    try {
        const normalizedWorkflowParams = normalizeWorkflowParamsForSave()
        const workflowParamErrors = validateWorkflowParamsForSave(normalizedWorkflowParams)
        if (workflowParamErrors.length > 0) {
            alert('流程参数配置有误：\n' + workflowParamErrors.join('\n'))
            return false
        }
        workflowParams.value = normalizedWorkflowParams

        // Get graph from FlowCanvas
        const graph = flowCanvasRef.value?.getGraph()
        if (!graph) {
            throw new Error('Graph not available')
        }

        const invalidEnabledGlobalParamKeys = projectParams.value
            .filter((p) => enabledGlobalParams.value.includes(p.key))
            .map((p) => String(p.key || '').trim())
            .filter((key) => !isValidIdentifier(key))
        if (invalidEnabledGlobalParamKeys.length > 0) {
            alert('全局参数名称不合法：\n' + Array.from(new Set(invalidEnabledGlobalParamKeys)).join('\n'))
            return false
        }

        const outputMappingErrors = validateOutputMappingKeys(graph)
        if (outputMappingErrors.length > 0) {
            alert('输出变量映射配置有误：\n' + outputMappingErrors.join('\n'))
            return false
        }
        
        // Build pipeline tree from graph with params
        // Filter enabled global params from projectParams
        const enabledGlobalParamsList: ParamDefinition[] = projectParams.value
            .filter(p => enabledGlobalParams.value.includes(p.key))
            .map(p => ({ key: p.key, value: p.value }))
        
        // Map workflow params
        const workflowParamsList: ParamDefinition[] = normalizedWorkflowParams
            .filter(p => p.key)
            .map(p => ({ key: p.key, value: p.value }))
        
        const buildOptions: BuildPipelineOptions = {
            projectId: selectedProjectId.value || undefined,
            globalParams: enabledGlobalParamsList,
            workflowParams: workflowParamsList
        }
        
        const pipelineTree = buildPipelineTree(graph, buildOptions)
        
        // Validate pipeline tree
        const validation = validatePipelineTree(pipelineTree)
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'))
            return false
        }
        
        // Get graph JSON data for storage
        const graphDataJSON = buildCurrentGraphData(normalizedWorkflowParams)
        graphData.value = graphDataJSON
        if (activePanel.value === 'json') {
            jsonDraft.value = JSON.stringify(graphDataJSON, null, 2)
        }

        const payload = {
            name: workflowName.value,
            tags: workflowTags.value,
            project: selectedProjectId.value || null,
            graph_data: graphDataJSON,
            pipeline_tree: pipelineTree,
            notify_template: notifyTemplate.value,
            visible_roles: visibleRoles.value,
            visible_user_ids: visibleUserIds.value
        }
        
        // Use PATCH for existing workflows, POST for new ones
        if (workflowId.value) {
            await axios.patch(`/api/workflows/${workflowId.value}/`, payload)
        } else {
            const resp = await axios.post('/api/workflows/', payload)
            // Update workflowId so subsequent saves update instead of create
            workflowId.value = resp.data.id
        }
        lastSaved.value = 'just now'
        showSaveModal.value = false
        return true
    } catch (e: any) {
        console.error('Failed to save workflow:', e)
        alert('Failed to save workflow: ' + (e.message || 'Unknown error'))
        return false
    } finally {
        isSaving.value = false
    }
}

const loadWorkflow = async (id: string, isClone = false) => {
    isLoading.value = true
    try {
        const resp = await axios.get(`/api/workflows/${id}/`)
        const workflow = resp.data
        
        if (isClone) {
             workflowId.value = null
             workflowName.value = `${workflow.name}`
             workflowTags.value = workflow.tags || []
             selectedProjectId.value = workflow.project || ''
        } else {
             workflowId.value = id
             workflowName.value = workflow.name || 'Untitled Workflow'
             workflowTags.value = workflow.tags || []
             selectedProjectId.value = workflow.project || ''
        }
        notifyTemplate.value = workflow.notify_template || ''
        visibleRoles.value = workflow.visible_roles || []
        visibleUserIds.value = workflow.visible_user_ids || []

        graphData.value = workflow.graph_data || {}
        jsonDraft.value = JSON.stringify(graphData.value, null, 2)
        
        // Load enabled global params from graph_data
        if (workflow.graph_data && workflow.graph_data.global_params_enabled) {
            enabledGlobalParams.value = workflow.graph_data.global_params_enabled
        } else {
            enabledGlobalParams.value = []
        }
        
        // Load workflow params
        if (workflow.graph_data && Array.isArray(workflow.graph_data.workflow_params)) {
            workflowParams.value = workflow.graph_data.workflow_params.map((p: any) => normalizeWorkflowParam(p))
        } else {
            workflowParams.value = []
        }
        selectedWorkflowParamIndex.value = null
        
        // Wait for FlowCanvas to be mounted, then load graph
        await nextTick()
        if (flowCanvasRef.value && workflow.graph_data) {
            flowCanvasRef.value.loadGraph(workflow.graph_data)
        }
        
        lastSaved.value = isClone ? 'not saved' : 'loaded'
    } catch (e: any) {
        console.error('Failed to load workflow:', e)
        alert('Failed to load workflow: ' + (e.message || 'Not found'))
    } finally {
        isLoading.value = false
    }
}

const handleCreateTask = async () => {
    // Enforce Save (and Validation) before creating task
    // The modal handles creation, but we want to ensure save first
    if (!workflowId.value) return
    
    // If not saved or modified, maybe save?
    // For now, simpler to just open modal
    // But original logic enforced save
    
    // We can hook into the 'Create Task' button click
    const saved = await handleSave()
    if (!saved) return
    
    // showCreateTaskModal.value = true
    // Navigate to Create Task Page
    router.push({
        name: 'task-create',
        params: { workflowId: workflowId.value }
    })
}

onMounted(async () => {
    fetchProjects()
    fetchProjectMembers()
    
    // Check if editing an existing workflow or cloning
    const id = route.params.id as string
    const cloneFrom = route.query.clone_from as string
    
    if (id && id !== 'new') {
        await loadWorkflow(id)
    } else if (cloneFrom) {
        // Clone mode: load original data but treat as new
        await loadWorkflow(cloneFrom, true)
    } else {
        const defaultProjectId = route.query.project_id as string | undefined
        if (defaultProjectId) {
            selectedProjectId.value = defaultProjectId
        }
    }
})
</script>
