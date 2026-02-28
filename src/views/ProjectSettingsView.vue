<template>
  <div class="h-full flex bg-white">
    <!-- Sidebar Navigation -->
    <aside class="w-60 min-w-60 bg-white border-r border-gray-200 flex flex-col">
      <div class="px-5 pt-5 pb-4">
        <button @click="$router.back()" class="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-xs mb-3 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          返回
        </button>
        <h1 class="text-lg font-bold text-gray-800">项目设置</h1>
        <p class="text-xs text-gray-400 mt-1 truncate">{{ form.name || 'Loading...' }}</p>
      </div>

      <div class="border-t border-gray-100"></div>

      <nav class="flex-1 overflow-y-auto py-3 px-3">
        <!-- 基础 -->
        <div class="mb-4">
          <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">基础</div>
          <button
            v-for="item in navGroups.basic" :key="item.key"
            @click="activeSection = item.key"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
            :class="activeSection === item.key
              ? 'bg-blue-50 text-blue-600 font-medium border-l-[3px] border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-l-[3px] border-transparent'"
          >
            <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
            {{ item.label }}
          </button>
        </div>

        <!-- 集成 -->
        <div class="mb-4">
          <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">集成</div>
          <button
            v-for="item in navGroups.integration" :key="item.key"
            @click="activeSection = item.key"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
            :class="activeSection === item.key
              ? 'bg-blue-50 text-blue-600 font-medium border-l-[3px] border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-l-[3px] border-transparent'"
          >
            <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
            {{ item.label }}
          </button>
        </div>

        <!-- 高级 -->
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">高级</div>
          <button
            v-for="item in navGroups.advanced" :key="item.key"
            @click="activeSection = item.key"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
            :class="activeSection === item.key
              ? 'bg-blue-50 text-blue-600 font-medium border-l-[3px] border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-l-[3px] border-transparent'"
          >
            <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
            {{ item.label }}
          </button>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <div class="px-8 py-4 bg-white border-b border-gray-200 flex items-baseline gap-3">
        <h2 class="text-lg font-semibold text-gray-800">{{ currentSectionMeta.title }}</h2>
        <span class="text-sm text-gray-400">{{ currentSectionMeta.subtitle }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-8 py-6">

          <!-- ==================== General ==================== -->
          <section v-if="activeSection === 'general'">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">项目名称</label>
                <input v-model="form.name" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">项目描述</label>
                <textarea v-model="form.description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"></textarea>
              </div>
              <div class="flex justify-end pt-4 border-t border-gray-100">
                <button @click="saveGeneral" :disabled="saving" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {{ saving ? '保存中...' : '保存更改' }}
                </button>
              </div>
            </div>
          </section>

          <!-- ==================== Members ==================== -->
          <section v-if="activeSection === 'members'">
            <!-- Add Member -->
            <div class="flex gap-4 mb-6 bg-gray-50 p-4 rounded-md items-start">
              <div class="flex-1 relative">
                <input
                  v-model="userSearchQuery"
                  @input="handleSearchInput"
                  @focus="showUserDropdown = true"
                  @blur="delayHideDropdown"
                  type="text"
                  placeholder="搜索用户名或邮箱..."
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                  autocomplete="off"
                />
                <div v-if="showUserDropdown && foundUsers.length > 0" class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
                  <div v-for="user in foundUsers" :key="user.id" @click="selectUser(user)" class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 text-gray-900">
                    <span class="block truncate font-medium">{{ user.username }}</span>
                    <span class="block truncate text-xs text-gray-500">{{ user.email }}</span>
                  </div>
                </div>
              </div>
              <select v-model="newMemberRole" class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 h-[38px]">
                <option value="REPORTER">Reporter</option>
                <option value="DEVELOPER">Developer</option>
                <option value="MAINTAINER">Maintainer</option>
              </select>
              <button @click="addMember" :disabled="!selectedUser || addingMember" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 h-[38px]">
                添加成员
              </button>
            </div>

            <!-- List -->
            <div class="overflow-hidden border rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="member in members" :key="member.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                          {{ member.username ? member.username.substring(0,2).toUpperCase() : '??' }}
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900">{{ member.username }}</div>
                          <div class="text-sm text-gray-500">{{ member.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <select v-model="member.role" @change="updateRole(member)" class="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-2 py-1" :disabled="member.role === 'OWNER'">
                        <option value="OWNER">Owner</option>
                        <option value="MAINTAINER">Maintainer</option>
                        <option value="DEVELOPER">Developer</option>
                        <option value="REPORTER">Reporter</option>
                      </select>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button @click="removeMember(member)" class="text-red-600 hover:text-red-900" :disabled="member.role === 'OWNER'">
                        移除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ==================== AI Model Settings ==================== -->
          <section v-if="activeSection === 'ai'">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm text-gray-500">配置多个 AI 模型提供商，用于工作流节点。</p>
              <button @click="addModelGroup" class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">+ 添加分组</button>
            </div>

            <div v-if="modelGroups.length === 0" class="text-center py-8 text-gray-400 text-sm">
              未配置模型分组。点击“添加分组”来创建一个。
            </div>

            <div class="space-y-4">
              <div v-for="(group, gIndex) in modelGroups" :key="gIndex" class="border rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <input type="checkbox" v-model="group.enabled" class="rounded border-gray-300 text-blue-600" />
                    <input v-model="group.title" type="text" placeholder="Group Title (e.g., Banana, OpenAI)" class="text-sm font-medium text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1" />
                  </div>
                  <button @click="removeModelGroup(gIndex)" class="text-red-500 hover:text-red-700 text-xs">移除</button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">API URL</label>
                    <input v-model="group.api_url" type="text" placeholder="https://api.example.com/..." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">API Key</label>
                    <input v-model="group.api_key" type="password" placeholder="sk-..." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                  </div>
                </div>

                <!-- Models List -->
                <div class="bg-gray-50 rounded p-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-gray-600 uppercase">Models</span>
                    <button @click="addModel(gIndex)" class="text-xs text-blue-600 hover:text-blue-800">+ 添加模型</button>
                  </div>
                  <div v-if="group.models.length === 0" class="text-xs text-gray-400 py-2">未配置模型。点击“添加模型”来添加一个。</div>
                  <div v-for="(model, mIndex) in group.models" :key="mIndex" class="flex items-center gap-2 py-1">
                    <input type="checkbox" v-model="model.enabled" class="rounded border-gray-300 text-blue-600" />
                    <input v-model="model.name" type="text" placeholder="模型名称 (e.g., stable-diffusion-xl)" class="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500" />
                    <button @click="removeModel(gIndex, mIndex)" class="text-red-400 hover:text-red-600 text-xs">×</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button @click="saveAiConfig" :disabled="savingAiConfig" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingAiConfig ? '保存中...' : '保存设置' }}
              </button>
            </div>
          </section>

          <!-- ==================== MCP Services ==================== -->
          <section v-if="activeSection === 'mcp'">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm text-gray-500">配置 MCP (Model Context Protocol) 服务器以扩展 AI 功能。</p>
              <button @click="addMCPServer" class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">+ 添加服务器</button>
            </div>

            <div v-if="mcpServers.length === 0" class="text-center py-8 text-gray-400 text-sm">
              未配置 MCP 服务器。点击“添加服务器”来添加一个。
            </div>

            <div class="space-y-4">
              <div v-for="(srv, sIndex) in mcpServers" :key="sIndex" class="border rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <button
                      @click="srv.enabled = !srv.enabled"
                      :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors', srv.enabled ? 'bg-blue-600' : 'bg-gray-300']"
                    >
                      <span :class="['inline-block h-3 w-3 transform rounded-full bg-white transition-transform', srv.enabled ? 'translate-x-5' : 'translate-x-1']" />
                    </button>
                    <input v-model="srv.name" type="text" placeholder="Server Name" class="text-sm font-medium text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1" />
                  </div>
                  <div class="flex items-center gap-2">
                    <button @click="testMCPServer(sIndex)" :disabled="srv.testing" class="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-2 py-1 disabled:opacity-50">
                      {{ srv.testing ? '连接中...' : '测试连接' }}
                    </button>
                    <button @click="removeMCPServer(sIndex)" class="text-red-500 hover:text-red-700 text-xs">移除</button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Server ID</label>
                    <input v-model="srv.id" type="text" placeholder="browser (unique identifier)" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">SSE URL</label>
                    <input v-model="srv.url" type="text" placeholder="http://mcp-browser:3001/sse" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Description</label>
                  <input v-model="srv.description" type="text" placeholder="Brief description" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                </div>

                <div v-if="srv.testResult" class="mt-3 p-3 rounded text-sm" :class="srv.testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
                  <div v-if="srv.testResult.success">
                    <span class="font-medium">✓ Connected</span> — {{ srv.testResult.tools_count }} tools available
                    <div v-if="srv.testResult.tools?.length" class="mt-2 flex flex-wrap gap-1">
                      <span v-for="t in srv.testResult.tools" :key="t.name" class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{{ t.name }}</span>
                    </div>
                  </div>
                  <div v-else>
                    <span class="font-medium">✗ Failed</span> — {{ srv.testResult.error }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button @click="saveMCPConfig" :disabled="savingMCP" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingMCP ? '保存中...' : '保存设置' }}
              </button>
            </div>
          </section>

          <!-- ==================== Global Parameters ==================== -->
          <section v-if="activeSection === 'params'">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm text-gray-500">定义全局参数，所有工作流均可使用。<code>project_id</code> 始终可用。</p>
              <button @click="addGlobalParam" class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">+ 添加参数</button>
            </div>

            <div class="space-y-3">
              <!-- Fixed Project ID -->
              <div class="flex items-start gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div class="w-1/4">
                  <label class="block text-xs font-medium text-gray-500 uppercase">Key</label>
                  <input type="text" value="project_id" disabled class="w-full text-sm bg-gray-100 text-gray-500 border-gray-300 rounded px-2 py-1" />
                </div>
                <div class="w-1/3">
                  <label class="block text-xs font-medium text-gray-500 uppercase">Value</label>
                  <input type="text" :value="projectId" disabled class="w-full text-sm bg-gray-100 text-gray-500 border-gray-300 rounded px-2 py-1" />
                </div>
                <div class="flex-1">
                  <label class="block text-xs font-medium text-gray-500 uppercase">Description</label>
                  <input type="text" value="Unique Identifier for this project (Fixed)" disabled class="w-full text-sm bg-gray-100 text-gray-500 border-gray-300 rounded px-2 py-1" />
                </div>
                <div class="w-8"></div>
              </div>

              <div v-if="globalParams.length === 0" class="text-center py-4 text-gray-400 text-sm">
                暂无自定义参数。点击“添加参数”创建
              </div>

              <div v-for="(param, index) in globalParams" :key="index" class="flex items-start gap-3 p-3 rounded border border-gray-100 hover:border-gray-300 transition-colors">
                <div class="w-1/4">
                  <label class="block text-xs font-medium text-gray-500 uppercase mb-1">Key</label>
                  <input v-model="param.key" type="text" placeholder="e.g. API_KEY" class="w-full text-sm border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none" />
                </div>
                <div class="w-1/3">
                  <label class="block text-xs font-medium text-gray-500 uppercase mb-1">Value</label>
                  <input v-model="param.value" type="text" placeholder="Value..." class="w-full text-sm border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none" />
                </div>
                <div class="flex-1">
                  <label class="block text-xs font-medium text-gray-500 uppercase mb-1">Description</label>
                  <input v-model="param.description" type="text" placeholder="Description (Optional)" class="w-full text-sm border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none" />
                </div>
                <div class="w-8 flex items-center justify-center pt-6">
                  <button @click="removeGlobalParam(index)" class="text-red-400 hover:text-red-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <button @click="saveGlobalParams" :disabled="savingGlobalParams" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingGlobalParams ? '保存中...' : '保存设置' }}
              </button>
            </div>
          </section>

          <!-- ==================== Workflow Tags ==================== -->
          <section v-if="activeSection === 'tags'">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm text-gray-500">定义工作流的标签。</p>
              <button @click="addWorkflowTag" class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">+ 添加标签</button>
            </div>

            <div v-if="workflowTags.length === 0" class="text-center py-4 text-gray-400 text-sm">
              暂无标签。点击“添加标签”创建一个。
            </div>

            <div v-else class="space-y-3">
              <div v-for="(tag, index) in workflowTags" :key="index" class="flex items-center gap-3 p-3 rounded border border-gray-100 hover:border-gray-300 transition-colors">
                <div class="flex-1">
                  <label class="block text-xs font-medium text-gray-500 uppercase mb-1">标签名称</label>
                  <input v-model="workflowTags[index]" type="text" placeholder="e.g. Backend" class="w-full text-sm border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none" />
                </div>
                <div class="w-8 flex items-center justify-center pt-6">
                  <button @click="removeWorkflowTag(index)" class="text-red-400 hover:text-red-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <button @click="saveWorkflowTags" :disabled="savingWorkflowTags" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingWorkflowTags ? '保存中...' : '保存设置' }}
              </button>
            </div>
          </section>

          <!-- ==================== Client Agent ==================== -->
          <section v-if="activeSection === 'agent'">
            <p class="text-sm text-gray-500 mb-4">配置客户端代理代码的 git 仓库。这里的分支是默认分支；单个节点可以覆盖</p>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">仓库地址</label>
                <input v-model="agentRepoUrl" type="text" placeholder="https://github.com/user/repo.git" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">仓库 Token</label>
                <input v-model="agentRepoToken" type="password" placeholder="ghp_... or glpat-..." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p class="mt-1 text-xs text-gray-400">用于认证客户端代理上的操作。</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">默认分支</label>
                <input v-model="agentRepoRef" type="text" placeholder="main" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2" />
                <p class="mt-1 text-xs text-gray-400">默认分支/引用。可以被工作流节点覆盖。</p>
              </div>
            </div>

            <div class="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <button @click="saveAgentConfig" :disabled="savingAgentConfig" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ savingAgentConfig ? '保存中...' : '保存设置' }}
              </button>
            </div>
          </section>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { FileText, Users, Bot, Plug, Globe, Tag, Monitor } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectId = route.params.id

// ==================== Sidebar Navigation ====================
const activeSection = ref('general')

interface NavItem { key: string; label: string; icon: any }

const navGroups: Record<string, NavItem[]> = {
  basic: [
    { key: 'general', label: '基本信息', icon: FileText },
    { key: 'members', label: '项目成员', icon: Users },
  ],
  integration: [
    { key: 'ai', label: 'AI 模型', icon: Bot },
    { key: 'mcp', label: 'MCP 服务', icon: Plug },
    { key: 'agent', label: '客户端代理仓库', icon: Monitor },
  ],
  advanced: [
    { key: 'params', label: '全局参数', icon: Globe },
    { key: 'tags', label: '工作流标签', icon: Tag },
  ],
}

const sectionMeta: Record<string, { title: string; subtitle: string }> = {
  general:  { title: '基本信息',     subtitle: '编辑项目的基本信息' },
  members:  { title: '项目成员',     subtitle: '管理项目成员和角色' },
  ai:       { title: 'AI 模型',      subtitle: '配置 AI 模型提供商' },
  mcp:      { title: 'MCP 服务',     subtitle: '管理 MCP 服务器连接' },
  params:   { title: '全局参数',     subtitle: '定义全局变量供工作流使用' },
  tags:     { title: '工作流标签',   subtitle: '定义标准标签分类工作流' },
  agent:    { title: '客户端代理仓库', subtitle: '配置客户端代理的仓库' },
}

const currentSectionMeta = computed(() => sectionMeta[activeSection.value] || { title: '', subtitle: '' })

// ==================== Form State ====================
const form = ref({ name: '', description: '' })
const saving = ref(false)
const members = ref<any[]>([])

// Search State
const userSearchQuery = ref('')
const foundUsers = ref<any[]>([])
const showUserDropdown = ref(false)
const selectedUser = ref<any>(null)
let searchTimeout: any = null
const newMemberRole = ref('REPORTER')
const addingMember = ref(false)

// AI Config State
interface AIModel { name: string; enabled: boolean }
interface ModelGroup { title: string; enabled: boolean; api_url: string; api_key: string; models: AIModel[] }
const modelGroups = ref<ModelGroup[]>([])
const savingAiConfig = ref(false)

const addModelGroup = () => {
  modelGroups.value.push({ title: 'New Provider', enabled: true, api_url: '', api_key: '', models: [] })
}
const removeModelGroup = (index: number) => { modelGroups.value.splice(index, 1) }
const addModel = (groupIndex: number) => { modelGroups.value[groupIndex].models.push({ name: '', enabled: true }) }
const removeModel = (groupIndex: number, modelIndex: number) => { modelGroups.value[groupIndex].models.splice(modelIndex, 1) }

// Global Params State
interface GlobalParam { key: string; value: string; description: string }
const globalParams = ref<GlobalParam[]>([])
const savingGlobalParams = ref(false)
const addGlobalParam = () => { globalParams.value.push({ key: '', value: '', description: '' }) }
const removeGlobalParam = (index: number) => { globalParams.value.splice(index, 1) }

// MCP Servers State
interface MCPServer { id: string; name: string; url: string; enabled: boolean; description: string; testing?: boolean; testResult?: any }
const mcpServers = ref<MCPServer[]>([])
const savingMCP = ref(false)

const addMCPServer = () => { mcpServers.value.push({ id: '', name: '', url: '', enabled: true, description: '' }) }
const removeMCPServer = (index: number) => { mcpServers.value.splice(index, 1) }

const testMCPServer = async (index: number) => {
  const srv = mcpServers.value[index]
  if (!srv.url) { alert('Please enter an SSE URL first'); return }
  srv.testing = true; srv.testResult = null
  try {
    const { data } = await axios.post('/api/mcp/test/', { url: srv.url })
    srv.testResult = data
  } catch (e: any) {
    srv.testResult = { success: false, error: e.response?.data?.detail || 'Connection failed' }
  } finally { srv.testing = false }
}

const saveMCPConfig = async () => {
  savingMCP.value = true
  try {
    const cleanServers = mcpServers.value.map(s => ({ id: s.id, name: s.name, url: s.url, enabled: s.enabled, description: s.description }))
    mcpServers.value.forEach(s => { delete s.testing; delete s.testResult })
    await axios.patch(`/api/projects/${projectId}/`, { extra_config: { ...getExtraConfig(), mcp_servers: cleanServers } })
    alert('MCP settings saved successfully')
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to save MCP settings')
  } finally { savingMCP.value = false }
}

// Workflow Tags State
const workflowTags = ref<string[]>([])
const savingWorkflowTags = ref(false)
const addWorkflowTag = () => { workflowTags.value.push('') }
const removeWorkflowTag = (index: number) => { workflowTags.value.splice(index, 1) }

// Client Agent Config State
const agentRepoUrl = ref('')
const agentRepoToken = ref('')
const agentRepoRef = ref('main')
const savingAgentConfig = ref(false)

// Network Config State
const proxyUrl = ref('')

// ==================== Helper ====================
const getExtraConfig = () => ({
  model_groups: modelGroups.value,
  global_params: globalParams.value,
  workflow_tags: workflowTags.value,
  mcp_servers: mcpServers.value.map(s => ({ id: s.id, name: s.name, url: s.url, enabled: s.enabled, description: s.description })),
  proxy_url: proxyUrl.value,
  agent_repo_url: agentRepoUrl.value,
  agent_repo_token: agentRepoToken.value,
  agent_repo_ref: agentRepoRef.value,
})

// ==================== Save Methods ====================
const saveGeneral = async () => {
  saving.value = true
  try {
    await axios.patch(`/api/projects/${projectId}/`, form.value)
    alert('Project updated successfully')
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to update project')
  } finally { saving.value = false }
}

const saveAiConfig = async () => {
  savingAiConfig.value = true
  try {
    await axios.patch(`/api/projects/${projectId}/`, { extra_config: getExtraConfig() })
    alert('AI settings saved successfully')
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to save AI settings')
  } finally { savingAiConfig.value = false }
}

const saveGlobalParams = async () => {
  savingGlobalParams.value = true
  try {
    await axios.patch(`/api/projects/${projectId}/`, { extra_config: getExtraConfig() })
    alert('Global parameters saved successfully')
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to save global parameters')
  } finally { savingGlobalParams.value = false }
}

const saveWorkflowTags = async () => {
  savingWorkflowTags.value = true
  try {
    workflowTags.value = workflowTags.value.filter(t => t.trim())
    await axios.patch(`/api/projects/${projectId}/`, { extra_config: getExtraConfig() })
    alert('Workflow tags saved successfully')
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to save workflow tags')
  } finally { savingWorkflowTags.value = false }
}

const saveAgentConfig = async () => {
  savingAgentConfig.value = true
  try {
    await axios.patch(`/api/projects/${projectId}/`, { extra_config: getExtraConfig() })
    alert('Agent settings saved successfully')
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to save agent settings')
  } finally { savingAgentConfig.value = false }
}

// ==================== Fetch ====================
const fetchProject = async () => {
  try {
    const { data } = await axios.get(`/api/projects/${projectId}/`)
    form.value.name = data.name
    form.value.description = data.description
    if (data.extra_config) {
      if (Array.isArray(data.extra_config.model_groups)) modelGroups.value = data.extra_config.model_groups
      if (Array.isArray(data.extra_config.global_params)) globalParams.value = data.extra_config.global_params
      if (Array.isArray(data.extra_config.workflow_tags)) workflowTags.value = data.extra_config.workflow_tags
      if (data.extra_config.proxy_url) proxyUrl.value = data.extra_config.proxy_url
      if (data.extra_config.agent_repo_url !== undefined) agentRepoUrl.value = data.extra_config.agent_repo_url
      if (data.extra_config.agent_repo_token !== undefined) agentRepoToken.value = data.extra_config.agent_repo_token
      if (data.extra_config.agent_repo_ref) agentRepoRef.value = data.extra_config.agent_repo_ref
      if (Array.isArray(data.extra_config.mcp_servers)) mcpServers.value = data.extra_config.mcp_servers
    }
  } catch (e) {
    console.error("Failed to fetch project", e)
    alert('Failed to load project details.')
    router.push({ name: 'projects' })
  }
}

const fetchMembers = async () => {
  try {
    const { data } = await axios.get(`/api/projects/members/?project_id=${projectId}`)
    members.value = data.results || data
  } catch (e) { console.error("Failed to fetch members", e) }
}

// ==================== Members ====================
const handleSearchInput = () => {
  selectedUser.value = null
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!userSearchQuery.value) { foundUsers.value = []; return }
  searchTimeout = setTimeout(async () => {
    try {
      const { data } = await axios.get(`/api/auth/users/?search=${userSearchQuery.value}`)
      foundUsers.value = data.results || data
    } catch (e) { console.error(e) }
  }, 300)
}

const selectUser = (user: any) => { selectedUser.value = user; userSearchQuery.value = user.username; showUserDropdown.value = false }
const delayHideDropdown = () => { setTimeout(() => { showUserDropdown.value = false }, 200) }

const addMember = async () => {
  if (!selectedUser.value) return
  addingMember.value = true
  try {
    await axios.post('/api/projects/members/', { project: projectId, user: selectedUser.value.id, role: newMemberRole.value })
    userSearchQuery.value = ''; selectedUser.value = null; fetchMembers()
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to add member')
  } finally { addingMember.value = false }
}

const updateRole = async (member: any) => {
  try {
    await axios.patch(`/api/projects/members/${member.id}/`, { role: member.role })
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to update role'); fetchMembers()
  }
}

const removeMember = async (member: any) => {
  if (!confirm(`Remove ${member.username} from project?`)) return
  try {
    await axios.delete(`/api/projects/members/${member.id}/`); fetchMembers()
  } catch (e: any) {
    alert(e.response?.data?.detail || 'Failed to remove member')
  }
}

// ==================== Init ====================
onMounted(() => {
  fetchProject()
  fetchMembers()
})
</script>
