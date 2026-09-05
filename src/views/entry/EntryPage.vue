<template>
  <div class="entry-page">
    <div class="page-head">
      <h2>Entry</h2>
      <div class="head-right">
        <label class="field-inline">
          <span>Bill Number</span>
          <input
            ref="billNumberInput"
            v-model.trim="billNumber"
            :class="{ invalid: billNumberStatus.exists }"
            placeholder="Enter bill number"
            @keydown.enter.prevent="focusDate"
          />
          <small v-if="isAutoBillNumber" class="field-help">Auto-generated. You can edit this Bill Number.</small>
          <small v-if="billNumberStatus.checking" class="field-help">Checking Bill Number...</small>
          <small v-else-if="billNumberStatus.exists" class="field-error">Sales Bill Number already exists.</small>
          <small v-else-if="billNumberStatus.checked && billNumber" class="field-ok">Bill Number available</small>
        </label>
        <label class="field-inline">
          <span>Date</span>
          <input ref="invoiceDateInput" type="date" v-model="invoiceDate" @keydown.enter.prevent="focusParty" />
        </label>
        <label v-if="transactionType === 'sale'" class="field-inline compact checkbox-inline gst-toggle">
          <input v-model="isGST" type="checkbox" />
          <span>GST Invoice</span>
        </label>
      </div>
    </div>

    <Loader v-if="loading" />

    <div class="type-grid" v-else-if="!isEditMode">
      <label v-for="opt in typeOptions" :key="opt.value" class="type-option">
        <input type="radio" v-model="transactionType" :value="opt.value" @change="onTypeChange" />
        {{ opt.label }}
      </label>
    </div>

    <div class="tools" v-if="isSaleOrPurchase">
      <label class="field-inline compact">
        <span>Payment Type</span>
        <select v-model="paymentType">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="credit">Credit</option>
        </select>
      </label>
      <label v-if="paymentType === 'bank'" class="field-inline compact">
        <span>Bank Account</span>
        <select v-model="bankAccountId">
          <option value="">Select Bank Account</option>
          <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
            {{ account.accountName }} - {{ account.accountNumber }}
          </option>
        </select>
      </label>
      <CreatableAutocomplete
        ref="partyAutocomplete"
        v-model="selectedParty"
        class="tool-autocomplete"
        :label="transactionType === 'purchase' ? 'Supplier' : 'Customer'"
        :options="filteredParties"
        :get-option-label="(party) => party.name"
        :get-option-meta="(party) => party.mobile || party.phone || ''"
        placeholder="Search party"
        required
        allow-create
        @search="searchParties"
        @create="requestCreateParty"
        @select="focusSite"
      />
      <CreatableAutocomplete
        ref="siteAutocomplete"
        v-model="selectedSite"
        class="tool-autocomplete"
        label="Site"
        :disabled="!selectedParty"
        :options="sites"
        :get-option-label="(site) => site.name"
        :get-option-meta="(site) => `${site.isAssigned ? 'Assigned' : 'Other'}${site.address ? ` - ${site.address}` : ''}`"
        placeholder="Select site"
        allow-create
        @create="requestCreateSite"
        @select="focusApplicator"
      />
      <CreatableAutocomplete
        ref="applicatorAutocomplete"
        v-model="selectedApplicator"
        class="tool-autocomplete"
        label="Applicator"
        :disabled="!selectedSiteId"
        :options="assignedApplicatorOptions"
        :get-option-label="(applicator) => applicator.name"
        :get-option-meta="(applicator) => `${applicator.isAssigned ? 'Assigned' : 'Other'}${applicator.mobile ? ` - ${applicator.mobile}` : ''}`"
        placeholder="Select applicator"
        allow-create
        @create="openApplicatorQuickCreate"
        @select="focusProduct"
      />
      <CreatableAutocomplete
        ref="productAutocomplete"
        v-model="selectedProduct"
        class="tool-autocomplete"
        label="Product"
        :options="filteredProducts"
        :get-option-label="(product) => product.name"
        :get-option-meta="(product) => product.sku || product.unitName || ''"
        placeholder="Search product"
        allow-create
        @search="searchProducts"
        @create="openProductQuickCreate"
        @select="handleProductSelect"
      />
      <span v-if="selectedParty && selectedSiteId && !assignedApplicators.length" class="muted-note">
        No applicator assigned for this site
      </span>
      <label class="field-inline compact checkbox-inline">
        <input v-model="showCost" type="checkbox" />
        <span>Show Cost / Purchase Price</span>
      </label>
      <div class="selected">Party: {{ selectedParty?.name || 'Not selected' }}</div>
    </div>

    <div class="tools" v-else>
      <select v-model="selectedReturnBillId" @change="loadReturnBillItems">
        <option value="">Select Previous Bill</option>
        <option v-for="bill in returnBills" :key="bill._id" :value="bill._id">
          {{ bill.invoiceNo }} - {{ formatDate(bill.invoiceDate) }} - {{ bill.partyId?.name }}
        </option>
      </select>
      <label class="field-inline compact checkbox-inline">
        <input v-model="showCost" type="checkbox" />
        <span>Show Cost / Purchase Price</span>
      </label>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Product Name</th>
            <th>Unit</th>
            <th>Available Stock</th>
            <th>{{ isReturn ? 'Remaining Qty' : 'Quantity' }}</th>
            <th>Price</th>
            <th v-if="showCost">Cost</th>
            <th>Total Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="`${row.productId}-${idx}`">
            <td>{{ idx + 1 }}</td>
            <td>{{ row.productName }}</td>
            <td>{{ row.unitName || "-" }}</td>
            <td>{{ row.availableStock ?? '-' }}</td>
            <td>
              <input
                :ref="(el) => setQuantityInput(el, idx)"
                type="number"
                min="0"
                :max="isReturn ? row.maxQty : undefined"
                v-model.number="row.quantity"
                @input="updateRowFromRate(row)"
                @keydown.enter.prevent="focusRowRate(idx)"
              />
            </td>
            <td>
              <input :ref="(el) => setRateInput(el, idx)" type="number" min="0" v-model.number="row.rate" :readonly="isReturn" @input="updateRowFromRate(row)" @keydown.enter.prevent="focusRowTotal(idx)" />
              <div v-if="isSaleOrPurchase && row.lastRate !== null" class="rate-hint">
                Last rate: {{ money(row.lastRate) }}
              </div>
            </td>
            <td v-if="showCost">{{ money(getProductCost(row.productId)) }}</td>
            <td>
              <input
                v-if="isSaleOrPurchase"
                type="number"
                min="0"
                 :step="decimalStep"
                :ref="(el) => setTotalInput(el, idx)"
                v-model.number="row.totalAmount"
                @input="updateRowFromTotal(row)"
                @keydown.enter.prevent="handleRowTotalEnter(idx)"
              />
              <span v-else>{{ money(row.totalAmount) }}</span>
            </td>
            <td>
              <button v-if="isSaleOrPurchase" class="btn btn-danger" @click="removeRow(idx)">Remove</button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="8" class="empty">No products selected</td>
          </tr>
        </tbody>
      </table>
    </div>

    <section v-if="isSaleOrPurchase" class="other-charges">
      <div class="section-head">
        <h3>Other Charges</h3>
        <button class="btn btn-secondary" type="button" @click="addOtherCharge">+ Add Charge</button>
      </div>
      <div v-if="otherCharges.length" class="charges-grid">
        <div class="charge-row charge-head">
          <span>Charge</span>
          <span>Amount</span>
          <span></span>
        </div>
        <div v-for="(charge, idx) in otherCharges" :key="`charge-${idx}`" class="charge-row">
          <input v-model.trim="charge.name" list="charge-options" placeholder="Freight" />
          <input type="number" min="0" :step="decimalStep" v-model.number="charge.amount" />
          <button class="btn btn-danger" type="button" @click="removeOtherCharge(idx)">Remove</button>
        </div>
      </div>
      <p v-else class="empty charges-empty">No other charges added</p>
      <datalist id="charge-options">
        <option v-for="name in chargeSuggestions" :key="name" :value="name" />
      </datalist>
    </section>

    <div v-if="isReturn" class="replacement">
      <label class="replacement-toggle">
        <input type="checkbox" v-model="createReplacement" />
        Create Replacement Bill
      </label>

      <div v-if="createReplacement" class="replacement-body">
        <div class="replacement-head">
          <h3>Replacement Items</h3>
          <button class="btn btn-secondary" @click="addReplacementRow">+ Add Item</button>
        </div>

        <div class="replacement-grid">
          <label v-if="transactionType === 'purchase_return'" class="field-inline">
            <span>Replacement Bill No</span>
            <input v-model.trim="replacementInvoiceNo" placeholder="Enter replacement bill no" />
          </label>
          <label class="field-inline">
            <span>Payment Type</span>
            <select v-model="replacementPaymentType">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="credit">Credit</option>
            </select>
          </label>
          <label v-if="replacementPaymentType === 'bank'" class="field-inline">
            <span>Bank Account</span>
            <select v-model="replacementBankAccountId">
              <option value="">Select Bank Account</option>
              <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
                {{ account.accountName }} - {{ account.accountNumber }}
              </option>
            </select>
          </label>
          <label class="field-inline">
            <span>Paid Amount</span>
            <input type="number" v-model.number="replacementPaidAmount" :disabled="replacementPaymentType !== 'credit'" />
          </label>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
            <th>Available Stock</th>
            <th>Qty</th>
            <th>Rate</th>
            <th v-if="showCost">Cost</th>
            <th>Total</th>
            <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in replacementRows" :key="`rep-${idx}`">
                <td>
                  <select v-model="row.productId" @change="onReplacementProductChange(row)">
                    <option value="">Select</option>
                    <option v-for="p in products" :key="p._id" :value="p._id">
                      {{ p.name }}
                    </option>
                  </select>
                </td>
                <td>{{ row.availableStock ?? "-" }}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    v-model.number="row.quantity"
                    @input="updateReplacementRowFromRate(row)"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    v-model.number="row.rate"
                    @input="updateReplacementRowFromRate(row)"
                  />
                  <div v-if="row.lastRate !== null" class="rate-hint">
                    Last rate: {{ money(row.lastRate) }}
                  </div>
                </td>
                <td v-if="showCost">{{ money(getProductCost(row.productId)) }}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    :step="decimalStep"
                    v-model.number="row.totalAmount"
                    @input="updateReplacementRowFromTotal(row)"
                  />
                </td>
                <td>
                  <button class="btn btn-danger" @click="removeReplacementRow(idx)">Remove</button>
                </td>
              </tr>
              <tr v-if="!replacementRows.length">
                <td colspan="6" class="empty">No replacement items</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="replacement-summary">
          <span>Return Total: {{ money(totalAmount) }}</span>
          <span>Replacement Total: {{ money(replacementTotal) }}</span>
          <strong>Net Difference: {{ money(netDifference) }}</strong>
        </div>
      </div>
    </div>

    <div class="foot">
      <span v-if="isSaleOrPurchase">Product Subtotal: {{ money(subtotalAmount) }}</span>
      <label v-if="isSaleOrPurchase && gstEnabled" class="field-inline compact tax-field">
        <span>GST / Tax</span>
        <input type="number" min="0" :step="decimalStep" v-model.number="taxAmount" />
      </label>
      <span v-if="isSaleOrPurchase">Other Charges: {{ money(otherChargesTotal) }}</span>
      <label v-if="isSaleOrPurchase && paymentType === 'credit'" class="field-inline compact tax-field">
        <span>Paid Amount</span>
        <input type="number" min="0" :step="decimalStep" v-model.number="paidAmount" />
      </label>
      <strong>Total Bill Amount: {{ money(totalAmount) }}</strong>
      <button class="btn btn-success" :disabled="saving" @click="save">{{ saving ? "Saving..." : isEditMode ? "Update" : "Save" }}</button>
    </div>


    <div v-if="partyQuickCreateOpen" class="modal-wrap" @click.self="closePartyQuickCreate">
      <form ref="partyModalRef" class="quick-create-modal" role="dialog" aria-modal="true" aria-labelledby="party-create-title" tabindex="-1" @submit.prevent="createPartyFromDraft">
        <div class="modal-head">
          <h3 id="party-create-title">Create {{ transactionType === "purchase" ? "Supplier" : "Customer" }}</h3>
          <button class="icon" type="button" @click="closePartyQuickCreate">X</button>
        </div>
        <label class="field-inline">
          <span>Party Name *</span>
          <input ref="partyNameInput" v-model.trim="partyDraft.name" />
        </label>
        <label class="field-inline">
          <span>Mobile Number</span>
          <input ref="partyMobileInput" v-model.trim="partyDraft.mobile" type="tel" placeholder="Enter mobile number" autocomplete="tel" data-autofocus />
        </label>
        <div class="modal-actions">
          <button class="btn btn-success" type="submit" :disabled="creatingParty">{{ creatingParty ? "Creating..." : "Create and Select" }}</button>
          <button class="btn btn-secondary" type="button" @click="closePartyQuickCreate">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="productQuickCreateOpen" class="modal-wrap" @click.self="closeProductQuickCreate">
      <form ref="productModalRef" class="quick-create-modal" role="dialog" aria-modal="true" aria-labelledby="product-create-title" tabindex="-1" @submit.prevent="createProductFromDraft">
        <div class="modal-head">
          <h3 id="product-create-title">Create Product</h3>
          <button class="icon" type="button" @click="closeProductQuickCreate">X</button>
        </div>
        <label class="field-inline">
          <span>Product Name *</span>
          <input ref="productNameInput" v-model.trim="productDraft.name" />
        </label>
        <label class="field-inline">
          <span>SKU / Code *</span>
          <input v-model.trim="productDraft.sku" />
        </label>
        <label class="field-inline">
          <span>Unit</span>
          <select ref="productUnitInput" v-model="productDraft.unitId" data-autofocus>
            <option value="">No unit</option>
            <option v-for="unit in units" :key="unit._id" :value="unit._id">
              {{ unit.name }}{{ unit.shortName ? ` (${unit.shortName})` : "" }}
            </option>
          </select>
        </label>
        <div class="quick-row">
          <input v-model.trim="newUnitName" placeholder="Create unit, e.g. Bag" />
          <button class="btn btn-secondary" type="button" @click="requestCreateUnit(newUnitName, 'product')">Create Unit</button>
        </div>
        <label class="field-inline">
          <span>Sale Rate</span>
          <input type="number" min="0" :step="decimalStep" v-model.number="productDraft.price" />
        </label>
        <label class="field-inline">
          <span>Purchase Rate</span>
          <input type="number" min="0" :step="decimalStep" v-model.number="productDraft.openingRate" />
        </label>
        <label class="field-inline">
          <span>Opening Stock</span>
          <input type="number" min="0" :step="decimalStep" v-model.number="productDraft.openingStock" placeholder="Enter opening stock" />
        </label>
        <label class="field-inline">
          <span>Low Stock Alert</span>
          <input type="number" min="0" :step="decimalStep" v-model.number="productDraft.lowStockAlert" />
        </label>
        <div class="modal-actions">
          <button class="btn btn-success" type="submit" :disabled="creatingProduct">{{ creatingProduct ? "Creating..." : "Create and Select" }}</button>
          <button class="btn btn-secondary" type="button" @click="closeProductQuickCreate">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="applicatorQuickCreateOpen" class="modal-wrap" @click.self="closeApplicatorQuickCreate">
      <form ref="applicatorModalRef" class="quick-create-modal" role="dialog" aria-modal="true" aria-labelledby="applicator-create-title" tabindex="-1" @submit.prevent="createApplicatorFromDraft">
        <div class="modal-head">
          <h3 id="applicator-create-title">Create Applicator</h3>
          <button class="icon" type="button" @click="closeApplicatorQuickCreate">X</button>
        </div>
        <label class="field-inline">
          <span>Applicator Name *</span>
          <input v-model.trim="applicatorDraft.name" />
        </label>
        <label class="field-inline">
          <span>Mobile</span>
          <input ref="applicatorMobileInput" v-model.trim="applicatorDraft.mobile" data-autofocus />
        </label>
        <label class="checkbox-inline">
          <input v-model="applicatorDraft.assign" type="checkbox" :disabled="!selectedParty || !selectedSiteId" />
          <span>Assign to selected Party and Site</span>
        </label>
        <div class="modal-actions">
          <button class="btn btn-success" type="submit" :disabled="creatingApplicator">{{ creatingApplicator ? "Creating..." : "Create and Select" }}</button>
          <button class="btn btn-secondary" type="button" @click="closeApplicatorQuickCreate">Cancel</button>
        </div>
      </form>
    </div>

    <ConfirmDialog
      v-model:open="confirmState.open"
      :title="confirmState.title"
      :message="confirmState.message"
      confirm-label="Create and Select"
      :loading="confirmState.loading"
      @confirm="confirmQuickCreate"
    />
    <aside :class="['panel left', { open: leftOpen }]">
      <div class="panel-head">
        <h3>Select Party</h3>
        <button class="icon" @click="leftOpen = false">X</button>
      </div>
      <input v-model="partySearch" placeholder="Search customer/supplier" />
      <div class="list">
        <button v-for="party in filteredParties" :key="party._id" @click="selectParty(party)">
          {{ party.name }}
        </button>
      </div>
    </aside>

    <aside :class="['panel right', { open: rightOpen }]">
      <div class="panel-head">
        <h3>Select Product</h3>
        <button class="icon" @click="rightOpen = false">X</button>
      </div>
      <input v-model="productSearch" placeholder="Search product" />
      <div class="list">
        <button v-for="product in filteredProducts" :key="product._id" @click="addProduct(product)">
          {{ product.name }}
        </button>
      </div>
    </aside>

    <div v-if="leftOpen || rightOpen" class="overlay" @click="closePanels" />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { getUsersApi } from "@/api/userApi";
import { hasUserRole } from "@/utils/userRole";
import { useCurrency } from "@/composables/useCurrency";
import { useCompanySettings } from "@/composables/useCompanySettings";
import { notifyError, notifySuccess, notifyWarning, parseApiError } from "@/utils/notifications";
import Loader from "@/components/Loader.vue";
import CreatableAutocomplete from "@/components/common/CreatableAutocomplete.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import { useFocusTrap } from "@/composables/useFocusTrap";
import {
  createApplicatorApi,
  createAssignmentApi,
  createSiteApi,
  createUnitApi,
  listAssignedApplicatorsBySiteApi,
  listSitesApi,
  listUnitsApi,
} from "@/api/applicatorApi";
import { createProductApi } from "@/api/productApi";

const route = useRoute();
const router = useRouter();
const props = defineProps({
  mode: { type: String, default: "create" },
  fixedType: { type: String, default: "" },
});

const typeOptions = [
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "sale_return", label: "Sale Return" },
  { value: "purchase_return", label: "Purchase Return" },
];

const transactionType = ref((props.fixedType || route.query.type || "sale").toString());
const rows = ref([]);
const products = ref([]);
const parties = ref([]);
const selectedParty = ref(null);
const selectedProduct = ref(null);
const sites = ref([]);
const selectedSiteId = ref("");
const assignedApplicators = ref([]);
const selectedApplicatorId = ref("");
const paymentType = ref("credit");
const bankAccountId = ref("");
const paidAmount = ref(0);
const taxAmount = ref(0);
const invoiceDate = ref(new Date().toISOString().slice(0, 10));
const billNumber = ref("");
const isGST = ref(false);
const otherCharges = ref([]);
const loading = ref(false);
const saving = ref(false);
const showCost = ref(false);
const billNumberInput = ref(null);
const invoiceDateInput = ref(null);
const partyAutocomplete = ref(null);
const siteAutocomplete = ref(null);
const applicatorAutocomplete = ref(null);
const productAutocomplete = ref(null);
const partyModalRef = ref(null);
const productModalRef = ref(null);
const applicatorModalRef = ref(null);
const partyNameInput = ref(null);
const partyMobileInput = ref(null);
const productNameInput = ref(null);
const productUnitInput = ref(null);
const applicatorMobileInput = ref(null);
const quantityInputs = ref([]);
const rateInputs = ref([]);
const totalInputs = ref([]);
const creatingParty = ref(false);
const creatingProduct = ref(false);
const creatingApplicator = ref(false);
const billNumberStatus = reactive({ checking: false, checked: false, exists: false });
let billNumberTimer = null;

const returnBills = ref([]);
const selectedReturnBillId = ref("");
const bankAccounts = ref([]);
const createReplacement = ref(false);
const replacementRows = ref([]);
const replacementPaymentType = ref("credit");
const replacementBankAccountId = ref("");
const replacementPaidAmount = ref(0);
const replacementInvoiceNo = ref("");
const units = ref([]);
const newUnitName = ref("");
const partyQuickCreateOpen = ref(false);
const partyDraft = reactive({ name: "", mobile: "" });
const productQuickCreateOpen = ref(false);
const productDraft = reactive({ name: "", sku: "", unitId: "", price: 0, openingRate: 0, openingStock: 0, lowStockAlert: 0 });
const applicatorQuickCreateOpen = ref(false);
const applicatorDraft = reactive({ name: "", mobile: "", assign: true });
const confirmState = reactive({ open: false, loading: false, type: "", name: "", title: "", message: "", context: null });
const chargeSuggestions = ["Freight", "Tea", "Toll", "Transport", "Loading", "Unloading", "Packing", "Other"];

const leftOpen = ref(false);
const rightOpen = ref(false);
const partySearch = ref("");
const productSearch = ref("");
const { formatCurrency: money, roundCurrency, currencyDecimals } = useCurrency();
const { gstEnabled, ensureCompanySettingsLoaded } = useCompanySettings();

const isEditMode = computed(() => props.mode === "edit");
const isSaleOrPurchase = computed(() => ["sale", "purchase"].includes(transactionType.value));
const isReturn = computed(() => !isSaleOrPurchase.value);
const isAutoBillNumber = computed(() => ["sale", "sale_return"].includes(transactionType.value));

const filteredParties = computed(() => {
  const q = partySearch.value.toLowerCase();
  const role = transactionType.value === "purchase" ? "supplier" : "customer";
  return parties.value
    .filter((p) => hasUserRole(p, role))
    .filter((p) => `${p.name || ""} ${p.mobile || ""} ${p.phone || ""}`.toLowerCase().includes(q));
});

const assignedApplicatorOptions = computed(() =>
  assignedApplicators.value.map((entry) => ({
    _id: entry.applicatorId?._id || entry.applicatorId,
    name: entry.applicatorName || entry.applicatorId?.name || "Applicator",
    mobile: entry.mobile || entry.applicatorId?.mobile || "",
    isAssigned: Boolean(entry.isAssigned),
  })),
);

const selectedSite = computed({
  get: () => sites.value.find((site) => String(site._id) === String(selectedSiteId.value)) || null,
  set: (site) => { selectedSiteId.value = site?._id || ""; },
});

const selectedApplicator = computed({
  get: () => assignedApplicatorOptions.value.find((applicator) => String(applicator._id) === String(selectedApplicatorId.value)) || null,
  set: (applicator) => { selectedApplicatorId.value = applicator?._id || ""; },
});

const filteredProducts = computed(() => {
  const q = productSearch.value.toLowerCase();
  return products.value.filter((p) => (p.name || "").toLowerCase().includes(q));
});

const subtotalAmount = computed(() =>
  roundCurrency(rows.value.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)),
);
const normalizedOtherCharges = computed(() =>
  otherCharges.value
    .map((charge) => ({
      name: String(charge.name || "").trim(),
      amount: roundCurrency(Number(charge.amount || 0)),
    }))
    .filter((charge) => charge.name && charge.amount > 0),
);
const otherChargesTotal = computed(() =>
  roundCurrency(normalizedOtherCharges.value.reduce((sum, charge) => sum + Number(charge.amount || 0), 0)),
);
const totalAmount = computed(() =>
  roundCurrency(
    subtotalAmount.value +
      (isSaleOrPurchase.value && gstEnabled.value ? Number(taxAmount.value || 0) : 0) +
      (isSaleOrPurchase.value ? otherChargesTotal.value : 0),
  ),
);
const replacementTotal = computed(() =>
  roundCurrency(
    replacementRows.value.reduce(
      (sum, row) => sum + Number(row.quantity || 0) * Number(row.rate || 0),
      0,
    ),
  ),
);
const netDifference = computed(() => roundCurrency(replacementTotal.value - totalAmount.value));
const decimalStep = computed(() => (Number(currencyDecimals.value || 2) >= 3 ? "0.001" : "0.01"));

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const focusDate = () => invoiceDateInput.value?.focus?.();
const focusBillNumber = () => billNumberInput.value?.focus?.();
const focusParty = () => partyAutocomplete.value?.focus?.();
const focusSite = () => siteAutocomplete.value?.focus?.();
const focusApplicator = () => applicatorAutocomplete.value?.focus?.();
const focusProduct = () => productAutocomplete.value?.focus?.();
const setQuantityInput = (el, idx) => { if (el) quantityInputs.value[idx] = el; };
const setRateInput = (el, idx) => { if (el) rateInputs.value[idx] = el; };
const setTotalInput = (el, idx) => { if (el) totalInputs.value[idx] = el; };
const focusRowQuantity = (idx) => nextTick(() => quantityInputs.value[idx]?.focus?.());
const focusRowRate = (idx) => nextTick(() => rateInputs.value[idx]?.focus?.());
const focusRowTotal = (idx) => nextTick(() => totalInputs.value[idx]?.focus?.());
const handleRowTotalEnter = (idx) => {
  if (idx === rows.value.length - 1 && rows.value[idx]?.productId) {
    focusProduct();
    return;
  }
  focusRowQuantity(idx + 1);
};

const resetBillNumberStatus = () => {
  billNumberStatus.checking = false;
  billNumberStatus.checked = false;
  billNumberStatus.exists = false;
};

const checkBillNumber = async () => {
  const value = billNumber.value.trim();
  resetBillNumberStatus();
  if (!value || transactionType.value !== "sale") return;
  billNumberStatus.checking = true;
  try {
    const res = await http.get("/sales/check-number", {
      params: {
        billNumber: value,
        ...(isEditMode.value ? { excludeId: route.params.id } : {}),
      },
      skipNotify: true,
    });
    billNumberStatus.exists = Boolean(res.data?.exists);
    billNumberStatus.checked = true;
  } catch (err) {
    billNumberStatus.checked = false;
  } finally {
    billNumberStatus.checking = false;
  }
};

const getProductCost = (productId) => {
  const product = products.value.find((entry) => String(entry._id) === String(productId));
  return Number(product?.lastPurchaseRate || product?.openingRate || 0);
};

const updateRowFromRate = (row) => {
  const quantity = Number(row.quantity || 0);
  const rate = Number(row.rate || 0);
  row.totalAmount = roundCurrency(quantity * rate);
};

const updateRowFromTotal = (row) => {
  const quantity = Number(row.quantity || 0);
  const total = roundCurrency(row.totalAmount);
  row.totalAmount = total;
  if (!(quantity > 0)) {
    return;
  }
  row.rate = roundCurrency(total / quantity);
};

const updateReplacementRowFromRate = (row) => {
  const quantity = Number(row.quantity || 0);
  const rate = Number(row.rate || 0);
  row.totalAmount = roundCurrency(quantity * rate);
};

const updateReplacementRowFromTotal = (row) => {
  const quantity = Number(row.quantity || 0);
  const total = roundCurrency(row.totalAmount);
  row.totalAmount = total;
  if (!(quantity > 0)) {
    return;
  }
  row.rate = roundCurrency(total / quantity);
};

const closePanels = () => {
  leftOpen.value = false;
  rightOpen.value = false;
};

const searchParties = async (term = "") => {
  const role = transactionType.value === "purchase" ? "supplier" : "customer";
  const res = await http.get("/parties", { params: { search: term, role, limit: 20 }, skipNotify: true });
  parties.value = res.data || [];
};

const searchProducts = async (term = "") => {
  const res = await http.get("/products", { params: { search: term, status: "active", limit: 20 }, skipNotify: true });
  products.value = res.data?.data || res.data || [];
};

const handleProductSelect = async (product) => {
  await addProduct(product);
  selectedProduct.value = null;
};
const openConfirm = ({ type, name, title, message, context = null }) => {
  confirmState.type = type;
  confirmState.name = String(name || "").trim();
  confirmState.title = title;
  confirmState.message = message;
  confirmState.context = context;
  confirmState.loading = false;
  confirmState.open = true;
};

const requestCreateParty = (name) => {
  partyDraft.name = String(name || "").trim();
  partyDraft.mobile = "";
  partyQuickCreateOpen.value = true;
};

const closePartyQuickCreate = () => {
  if (creatingParty.value) return;
  partyQuickCreateOpen.value = false;
};

const requestCreateSite = (name) => {
  if (!selectedParty.value?._id) {
    notifyWarning("Please select a Party first.");
    return;
  }
  openConfirm({
    type: "site",
    name,
    title: "Create new Site?",
    message: `Site: ${name}\nParty: ${selectedParty.value.name}`,
  });
};

const requestCreateUnit = (name, source = "invoice") => {
  const unitName = String(name || "").trim();
  if (!unitName) {
    notifyWarning("Unit name is required.");
    return;
  }
  openConfirm({
    type: "unit",
    name: unitName,
    title: "Create new Unit?",
    message: `Name: ${unitName}\n\nThis unit will be saved and available for products.`,
    context: { source },
  });
};

const openProductQuickCreate = (name) => {
  const safeName = String(name || "").trim();
  productDraft.name = safeName;
  productDraft.sku = safeName ? safeName.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) : "";
  productDraft.unitId = "";
  productDraft.price = 0;
  productDraft.openingRate = 0;
  productDraft.openingStock = 0;
  productDraft.lowStockAlert = 0;
  productQuickCreateOpen.value = true;
};

const closeProductQuickCreate = () => {
  if (creatingProduct.value) return;
  productQuickCreateOpen.value = false;
};

const openApplicatorQuickCreate = (name) => {
  applicatorDraft.name = String(name || "").trim();
  applicatorDraft.mobile = "";
  applicatorDraft.assign = Boolean(selectedParty.value?._id && selectedSiteId.value);
  applicatorQuickCreateOpen.value = true;
};

const closeApplicatorQuickCreate = () => {
  if (creatingApplicator.value) return;
  applicatorQuickCreateOpen.value = false;
};

useFocusTrap(partyQuickCreateOpen, partyModalRef, { onEscape: closePartyQuickCreate });
useFocusTrap(productQuickCreateOpen, productModalRef, { onEscape: closeProductQuickCreate });
useFocusTrap(applicatorQuickCreateOpen, applicatorModalRef, { onEscape: closeApplicatorQuickCreate });

const createPartyFromDraft = async () => {
  if (creatingParty.value) return;
  if (!partyDraft.name) {
    notifyWarning("Party name is required.");
    partyNameInput.value?.focus?.();
    return;
  }

  const mobileDigits = String(partyDraft.mobile || "").replace(/\D/g, "");
  if (mobileDigits && (mobileDigits.length < 7 || mobileDigits.length > 15)) {
    notifyWarning("Please enter a valid mobile number.");
    partyMobileInput.value?.focus?.();
    return;
  }

  creatingParty.value = true;
  try {
    const role = transactionType.value === "purchase" ? "supplier" : "customer";
    const res = await http.post("/parties", {
      name: partyDraft.name,
      mobile: partyDraft.mobile,
      phone: partyDraft.mobile,
      roles: [role],
    });
    parties.value = [res.data, ...parties.value.filter((party) => String(party._id) !== String(res.data._id))];
    selectParty(res.data);
    partyQuickCreateOpen.value = false;
    await nextTick();
    focusSite();
    notifySuccess("Party created and selected successfully.");
  } catch (err) {
    notifyError(parseApiError(err) || "Unable to create Party.");
  } finally {
    creatingParty.value = false;
  }
};

const createProductFromDraft = async () => {
  if (creatingProduct.value) return;
  if (!productDraft.name || !productDraft.sku) {
    notifyWarning("Product name and SKU are required.");
    (productDraft.name ? productUnitInput.value : productNameInput.value)?.focus?.();
    return;
  }
  const openingStock = Number(productDraft.openingStock || 0);
  const lowStockAlert = Number(productDraft.lowStockAlert || 0);
  if (!Number.isFinite(openingStock) || !Number.isFinite(lowStockAlert) || openingStock < 0 || lowStockAlert < 0) {
    notifyWarning("Please enter valid non-negative stock values.");
    return;
  }
  creatingProduct.value = true;
  try {
    const res = await createProductApi({
      name: productDraft.name,
      sku: productDraft.sku,
      unitId: productDraft.unitId || null,
      price: Number(productDraft.price || 0),
      openingRate: Number(productDraft.openingRate || 0),
      openingStock,
      lowStockAlert,
    });
    const product = res.data;
    products.value = [product, ...products.value.filter((entry) => String(entry._id) !== String(product._id))];
    await addProduct(product);
    selectedProduct.value = null;
    productQuickCreateOpen.value = false;
    await nextTick();
    focusRowQuantity(rows.value.length - 1);
    notifySuccess("Product created and selected successfully.");
  } catch (err) {
    notifyError(parseApiError(err));
  } finally {
    creatingProduct.value = false;
  }
};

const createApplicatorFromDraft = async () => {
  if (creatingApplicator.value) return;
  if (!applicatorDraft.name) {
    notifyWarning("Applicator name is required.");
    return;
  }
  creatingApplicator.value = true;
  try {
    const res = await createApplicatorApi({ name: applicatorDraft.name, mobile: applicatorDraft.mobile, status: "active" });
    const applicator = res.data;
    const option = { _id: applicator._id, name: applicator.name, mobile: applicator.mobile || "" };
    assignedApplicators.value = [
      { applicatorId: option._id, applicatorName: option.name, mobile: option.mobile, isAssigned: true },
      ...assignedApplicators.value.filter((entry) => String(entry.applicatorId?._id || entry.applicatorId) !== String(option._id)),
    ];
    selectedApplicatorId.value = option._id;

    if (applicatorDraft.assign && selectedParty.value?._id && selectedSiteId.value) {
      try {
        await createAssignmentApi({ partyId: selectedParty.value._id, siteId: selectedSiteId.value, applicatorId: option._id, status: "active" });
      } catch (assignmentError) {
        if (assignmentError.response?.status !== 409) throw assignmentError;
      }
    }

    applicatorQuickCreateOpen.value = false;
    await nextTick();
    focusProduct();
    notifySuccess("Applicator created and selected successfully.");
  } catch (err) {
    notifyError(parseApiError(err));
  } finally {
    creatingApplicator.value = false;
  }
};

const confirmQuickCreate = async () => {
  confirmState.loading = true;
  try {
    if (confirmState.type === "party") {
      const role = transactionType.value === "purchase" ? "supplier" : "customer";
      const res = await http.post("/parties", { name: confirmState.name, roles: [role] });
      parties.value = [res.data, ...parties.value.filter((party) => String(party._id) !== String(res.data._id))];
      selectParty(res.data);
      notifySuccess("Party created and selected successfully.");
    }

    if (confirmState.type === "site") {
      const res = await createSiteApi({ name: confirmState.name, partyId: selectedParty.value._id });
      sites.value = [res.data, ...sites.value.filter((site) => String(site._id) !== String(res.data._id))];
      selectedSiteId.value = res.data._id;
      await loadApplicatorsForSite(selectedParty.value._id, selectedSiteId.value, false);
      await nextTick();
      focusApplicator();
      notifySuccess("Site created and selected successfully.");
    }

    if (confirmState.type === "unit") {
      const res = await createUnitApi({ name: confirmState.name });
      units.value = [res.data, ...units.value.filter((unit) => String(unit._id) !== String(res.data._id))];
      if (confirmState.context?.source === "product") productDraft.unitId = res.data._id;
      newUnitName.value = "";
      notifySuccess("Unit created successfully.");
    }

    confirmState.open = false;
  } catch (err) {
    notifyError(parseApiError(err));
  } finally {
    confirmState.loading = false;
  }
};

const selectParty = (party) => {
  selectedParty.value = party;
  selectedSiteId.value = "";
  selectedApplicatorId.value = "";
  leftOpen.value = false;
};

const addProduct = async (product) => {
  if (rows.value.some((row) => row.productId === product._id)) {
    rightOpen.value = false;
    return;
  }

  const stockRes = await http.get(`/stock/${product._id}`);
  let lastRate = null;
  if (selectedParty.value?._id && isSaleOrPurchase.value) {
    const lastRateRes = await http.get(`/products/${product._id}/last-rate`, {
      params: {
        partyId: selectedParty.value._id,
        type: transactionType.value,
      },
    });
    lastRate = lastRateRes.data?.lastRate ?? null;
  }
  rows.value.push({
    productId: product._id,
    productName: product.name,
    unitName: product.unitName || product.unitId?.name || product.attributes?.unit || product.attributes?.Unit || "",
    quantity: 1,
    rate: lastRate ?? 0,
    totalAmount: roundCurrency(lastRate ?? 0),
    lastRate,
    availableStock: stockRes.data.stock ?? 0,
  });
  rightOpen.value = false;
  await focusRowQuantity(rows.value.length - 1);
};

const removeRow = (idx) => rows.value.splice(idx, 1);
const addOtherCharge = () => {
  otherCharges.value.push({ name: "Freight", amount: 0 });
};
const removeOtherCharge = (idx) => otherCharges.value.splice(idx, 1);
const addReplacementRow = () =>
  replacementRows.value.push({
    productId: "",
    quantity: 1,
    rate: 0,
    totalAmount: 0,
    availableStock: null,
    lastRate: null,
  });
const removeReplacementRow = (idx) => replacementRows.value.splice(idx, 1);

const onReplacementProductChange = async (row) => {
  row.availableStock = null;
  row.lastRate = null;
  row.rate = 0;
  row.totalAmount = 0;

  if (!row.productId) {
    return;
  }

  const product = products.value.find((p) => String(p._id) === String(row.productId));
  const stockRes = await http.get(`/stock/${row.productId}`);
  row.availableStock = stockRes.data?.stock ?? 0;

  let lastRate = null;
  if (selectedParty.value?._id) {
    const lastRateRes = await http.get(`/products/${row.productId}/last-rate`, {
      params: {
        partyId: selectedParty.value._id,
        type: "sale",
      },
    });
    lastRate = lastRateRes.data?.lastRate ?? null;
  } else if (product && Number(product.lastSalePrice || 0) > 0) {
    lastRate = Number(product.lastSalePrice || 0);
  }

  row.lastRate = lastRate;
  row.rate = Number(lastRate ?? 0);
  row.totalAmount = roundCurrency(Number(row.quantity || 0) * Number(row.rate || 0));
};

const loadNextBillNo = async () => {
  if (!isAutoBillNumber.value) {
    billNumber.value = "";
    return;
  }

  if (transactionType.value === "sale") {
    const res = await http.get("/sales/next-number");
    billNumber.value = res.data?.invoiceNo || "";
    return;
  }

  const res = await http.get("/returns", { params: { billType: "SALE" } });
  billNumber.value = `SR-${(res.data || []).length + 1}`;
};

const loadReturnBills = async () => {
  if (!isReturn.value) return;
  const returnType = transactionType.value === "purchase_return" ? "PURCHASE_RETURN" : "SALE_RETURN";
  const res = await http.get("/returns/bills", { params: { returnType } });
  returnBills.value = res.data || [];
};

const loadReturnBillItems = async () => {
  rows.value = [];
  if (!selectedReturnBillId.value) return;

  const returnType = transactionType.value === "purchase_return" ? "PURCHASE_RETURN" : "SALE_RETURN";
  const res = await http.get(`/returns/bills/${selectedReturnBillId.value}/items`, {
    params: { returnType },
  });

  selectedParty.value = res.data.bill?.partyId || null;
  selectedSiteId.value = res.data.bill?.siteId?._id || res.data.bill?.siteId || "";
  selectedApplicatorId.value = res.data.bill?.applicatorId?._id || res.data.bill?.applicatorId || "";
  isGST.value = Boolean(res.data.bill?.isGST);
  invoiceDate.value = new Date().toISOString().slice(0, 10);

  rows.value = (res.data.items || [])
    .filter((item) => item.remainingQty > 0)
    .map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitName: item.unitName || item.productId?.unitName || "",
      availableStock: item.remainingQty,
      maxQty: item.remainingQty,
      quantity: 0,
      rate: item.rate,
      totalAmount: roundCurrency(0),
    }));
};

const loadSitesForParty = async (partyId, resetSelection = true) => {
  sites.value = [];
  assignedApplicators.value = [];
  if (resetSelection) {
    selectedSiteId.value = "";
    selectedApplicatorId.value = "";
  }
  if (!partyId) return;
  sites.value = (await listSitesApi({ partyId, includeOthers: true, limit: 100 })).data || [];
};

const loadApplicatorsForSite = async (partyId, siteId, resetSelection = true) => {
  assignedApplicators.value = [];
  if (resetSelection) selectedApplicatorId.value = "";
  if (!partyId || !siteId) return;
  assignedApplicators.value = (
    await listAssignedApplicatorsBySiteApi({ partyId, siteId })
  ).data || [];
};

const loadEditInvoice = async () => {
  if (!isEditMode.value || !isSaleOrPurchase.value) return;
  const endpoint = transactionType.value === "purchase" ? `/purchase/${route.params.id}` : `/sales/${route.params.id}`;
  const { data } = await http.get(endpoint);

  selectedParty.value =
    parties.value.find((party) => String(party._id) === String(data.partyId?._id || data.partyId || data.supplierId || data.vendorId || "")) ||
    data.partyId ||
    null;
  paymentType.value = String(data.paymentType || "credit").toLowerCase();
  bankAccountId.value = data.bankAccountId?._id || data.bankAccountId || "";
  paidAmount.value = Number(data.paidAmount || 0);
  selectedSiteId.value = data.siteId?._id || data.siteId || "";
  selectedApplicatorId.value = data.applicatorId?._id || data.applicatorId || "";
  isGST.value = Boolean(data.isGST);
  otherCharges.value = Array.isArray(data.otherCharges)
    ? data.otherCharges.map((charge) => ({
        name: charge.name || "",
        amount: Number(charge.amount || 0),
      }))
    : [];
  taxAmount.value = gstEnabled.value ? Number(data.tax || 0) : 0;
  invoiceDate.value = data.invoiceDate ? new Date(data.invoiceDate).toISOString().slice(0, 10) : invoiceDate.value;
  billNumber.value = data.invoiceNo || "";
  if (selectedParty.value?._id) {
    await loadSitesForParty(selectedParty.value._id, false);
    await loadApplicatorsForSite(selectedParty.value._id, selectedSiteId.value, false);
  }

  rows.value = await Promise.all((data.items || []).map(async (item) => {
    const productId = String(item.productId?._id || item.productId || "");
    const product = products.value.find((entry) => String(entry._id) === productId);
    let availableStock = null;
    try {
      const stockRes = await http.get(`/stock/${productId}`);
      availableStock = stockRes.data?.stock ?? null;
    } catch (err) {
      availableStock = null;
    }
    return {
      productId,
      productName: item.productId?.name || product?.name || item.productName || "-",
      unitName: item.unitName || item.productId?.unitName || product?.unitName || "",
      quantity: Number(item.quantity || 0),
      rate: Number(item.rate || 0),
      totalAmount: roundCurrency(Number(item.amount ?? Number(item.quantity || 0) * Number(item.rate || 0))),
      lastRate: null,
      availableStock,
    };
  }));
};

const onTypeChange = async () => {
  rows.value = [];
  selectedParty.value = null;
  sites.value = [];
  selectedSiteId.value = "";
  assignedApplicators.value = [];
  selectedApplicatorId.value = "";
  paidAmount.value = 0;
  taxAmount.value = 0;
  isGST.value = false;
  otherCharges.value = [];
  selectedReturnBillId.value = "";
  createReplacement.value = false;
  replacementRows.value = [];
  replacementPaymentType.value = "credit";
  replacementBankAccountId.value = "";
  replacementPaidAmount.value = 0;
  replacementInvoiceNo.value = "";
  await loadNextBillNo();
  await loadReturnBills();
};

const validateBillNumber = () => {
  if (!billNumber.value?.trim()) {
    notifyWarning("Please enter bill number");
    focusBillNumber();
    return false;
  }
  return true;
};

const save = async () => {
  if (saving.value) return;
  if (!rows.value.length) {
    notifyWarning("Please add at least one product");
    focusProduct();
    return;
  }

  if (!validateBillNumber()) {
    return;
  }

  if (transactionType.value === "sale") {
    await checkBillNumber();
    if (billNumberStatus.exists) {
      notifyWarning("Sales Bill Number already exists.");
      focusBillNumber();
      return;
    }
  }

  if (isSaleOrPurchase.value && !selectedParty.value?._id) {
    if (paymentType.value === "credit") {
      notifyWarning("Please select customer/supplier for credit");
      return;
    }
  }

  if (isSaleOrPurchase.value && !["cash", "bank", "credit"].includes(paymentType.value)) {
    notifyWarning("Please select payment type");
    return;
  }
  if (isSaleOrPurchase.value && paymentType.value === "bank" && !bankAccountId.value) {
    notifyWarning("Please select bank account");
    return;
  }

  if (transactionType.value === "sale") {
    const payload = {
      invoiceNo: billNumber.value.trim(),
      isGST: isGST.value,
      partyId: selectedParty.value?._id || null,
      siteId: selectedSiteId.value || null,
      applicatorId: selectedApplicatorId.value || null,
      paymentType: paymentType.value,
      bankAccountId: paymentType.value === "bank" ? bankAccountId.value : null,
      invoiceDate: invoiceDate.value,
      items: rows.value.map((r) => ({ productId: r.productId, quantity: r.quantity, rate: roundCurrency(r.rate) })),
      tax: gstEnabled.value ? Number(taxAmount.value || 0) : 0,
      otherCharges: normalizedOtherCharges.value,
      paidAmount: paymentType.value === "credit" ? Number(paidAmount.value || 0) : Number(totalAmount.value || 0),
    };
    const shouldNotifySiteAssigned = selectedSite.value && !selectedSite.value.isAssigned;
    const shouldNotifyApplicatorAssigned = selectedApplicator.value && !selectedApplicator.value.isAssigned;
    saving.value = true;
    try {
      if (isEditMode.value) {
        await http.put(`/sales/${route.params.id}`, payload);
      } else {
        await http.post("/sales", payload);
      }
      notifySuccess(isEditMode.value ? "Sale updated successfully." : "Sale saved successfully.");
      if (shouldNotifySiteAssigned) notifySuccess("Site assigned to Customer.");
      if (shouldNotifyApplicatorAssigned) notifySuccess("Applicator assigned to Customer.");
      router.push("/sales");
    } catch (err) {
      if (err.response?.data?.code === "DUPLICATE_BILL_NUMBER") {
        billNumberStatus.exists = true;
        billNumberStatus.checked = true;
        notifyError(err.response.data.message || "Sales Bill Number already exists.");
        focusBillNumber();
      } else {
        notifyError(parseApiError(err));
      }
    } finally {
      saving.value = false;
    }
    return;
  }

  if (transactionType.value === "purchase") {
    const payload = {
      partyId: selectedParty.value?._id || null,
      siteId: selectedSiteId.value || null,
      applicatorId: selectedApplicatorId.value || null,
      paymentType: paymentType.value,
      bankAccountId: paymentType.value === "bank" ? bankAccountId.value : null,
      invoiceNo: billNumber.value.trim(),
      invoiceDate: invoiceDate.value,
      items: rows.value.map((r) => ({ productId: r.productId, quantity: r.quantity, rate: roundCurrency(r.rate) })),
      tax: gstEnabled.value ? Number(taxAmount.value || 0) : 0,
      otherCharges: normalizedOtherCharges.value,
      paidAmount: paymentType.value === "credit" ? Number(paidAmount.value || 0) : Number(totalAmount.value || 0),
    };
    if (isEditMode.value) {
      await http.put(`/purchase/${route.params.id}`, payload);
    } else {
      await http.post("/purchase", payload);
    }
    notifySuccess(isEditMode.value ? "Purchase updated successfully." : "Purchase saved successfully.");
    router.push("/purchase");
    return;
  }

  const validRows = rows.value
    .filter((r) => Number(r.quantity || 0) > 0)
    .map((r) => ({ productId: r.productId, quantity: Number(r.quantity), rate: roundCurrency(r.rate) }));

  if (!selectedReturnBillId.value || !validRows.length) {
    notifyWarning("Select bill and enter return quantity");
    return;
  }

  let replacementPayload = null;
  if (createReplacement.value) {
    const repItems = replacementRows.value
      .filter((r) => r.productId && Number(r.quantity) > 0 && Number(r.rate) > 0)
      .map((r) => ({
        productId: r.productId,
        quantity: Number(r.quantity),
        rate: roundCurrency(r.rate),
      }));

    if (!repItems.length) {
      notifyWarning("Add at least one replacement item");
      return;
    }
    if (replacementPaymentType.value === "bank" && !replacementBankAccountId.value) {
      notifyWarning("Select bank account for replacement bill");
      return;
    }
    if (transactionType.value === "purchase_return" && !replacementInvoiceNo.value.trim()) {
      notifyWarning("Replacement purchase bill number is required");
      return;
    }

    replacementPayload = {
      enabled: true,
      items: repItems,
      paymentType: replacementPaymentType.value,
      bankAccountId:
        replacementPaymentType.value === "bank" ? replacementBankAccountId.value : null,
      paidAmount:
        replacementPaymentType.value === "credit" ? Number(replacementPaidAmount.value || 0) : null,
      invoiceNo: transactionType.value === "purchase_return" ? replacementInvoiceNo.value.trim() : null,
    };
  }

  if (transactionType.value === "sale_return") {
    const res = await http.post("/returns/sale", {
      returnNo: billNumber.value,
      billId: selectedReturnBillId.value,
      returnDate: invoiceDate.value,
      items: validRows,
      replacement: replacementPayload,
    });
    if (res.data?.replacementError) {
      notifyWarning(`Return saved, but replacement failed: ${res.data.replacementError}`);
    }
    notifySuccess("Sale return saved successfully.");
    router.push("/sale-return");
    return;
  }

  const res = await http.post("/returns/purchase", {
    returnNo: billNumber.value.trim(),
    billId: selectedReturnBillId.value,
    returnDate: invoiceDate.value,
    items: validRows,
    replacement: replacementPayload,
  });
  if (res.data?.replacementError) {
    notifyWarning(`Return saved, but replacement failed: ${res.data.replacementError}`);
  }
  notifySuccess("Purchase return saved successfully.");
  router.push("/purchase-return");
};

onMounted(async () => {
  loading.value = true;
  await ensureCompanySettingsLoaded();
  const initialRole = transactionType.value === "purchase" ? "supplier" : "customer";
  const [productRes, partyRes, bankRes, unitRes] = await Promise.all([
    http.get("/products", { params: { status: "active", limit: 50 }, skipNotify: true }),
    getUsersApi({ role: initialRole, limit: 50 }),
    http.get("/bank-accounts"),
    listUnitsApi({ status: "active" }),
  ]);
  products.value = productRes.data?.data || productRes.data || [];
  parties.value = partyRes.data || [];
  bankAccounts.value = bankRes.data || [];
  units.value = unitRes.data || [];
  if (isEditMode.value) {
    await loadEditInvoice();
  } else {
    await loadNextBillNo();
    await loadReturnBills();
  }
  if (route.query.billId && isReturn.value) {
    selectedReturnBillId.value = String(route.query.billId);
    await loadReturnBillItems();
  }
  loading.value = false;
});

watch(
  () => route.query.type,
  (type) => {
    if (!isEditMode.value && type && type !== transactionType.value) {
      transactionType.value = String(type);
      onTypeChange();
    }
  },
);

watch(
  () => billNumber.value,
  () => {
    clearTimeout(billNumberTimer);
    resetBillNumberStatus();
    if (transactionType.value !== "sale" || !billNumber.value.trim()) return;
    billNumberTimer = setTimeout(checkBillNumber, 400);
  },
);

watch(
  () => selectedParty.value?._id,
  (partyId) => {
    loadSitesForParty(partyId);
  },
);

watch(
  () => selectedSiteId.value,
  (siteId) => {
    loadApplicatorsForSite(selectedParty.value?._id, siteId);
  },
);
</script>

<style scoped>
.entry-page {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.head-right {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.field-inline {
  display: grid;
  gap: 6px;
  min-width: 190px;
}

.field-inline span {
  font-size: 12px;
  color: #475569;
  font-weight: 600;
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 14px 0;
}

.type-option {
  display: flex;
  gap: 6px;
  align-items: center;
  background: #f8fafc;
  padding: 8px 10px;
  border-radius: 8px;
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.checkbox-inline {
  min-width: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn {
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 8px 14px;
  min-width: 120px;
  height: 38px;
  width: auto;
  font-weight: 600;
}

.btn-primary {
  background: #0284c7;
  color: #fff;
}

.btn-secondary {
  background: #fff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}

.btn-success {
  background: #16a34a;
  color: #fff;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
  min-width: 90px;
  height: 32px;
  padding: 6px 10px;
}

.selected {
  font-weight: 600;
}

.muted-note {
  color: #b45309;
  font-size: 12px;
  font-weight: 600;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
}

th {
  background: #f8fafc;
  font-size: 13px;
  color: #334155;
}

tbody tr:hover {
  background: #f8fafc;
}

input,
select {
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

input.invalid {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.field-help,
.field-error,
.field-ok {
  font-size: 11px;
}

.field-help {
  color: #64748b;
}

.field-error {
  color: #dc2626;
}

.field-ok {
  color: #15803d;
}

input[type="number"] {
  width: 120px;
}

.empty {
  text-align: center;
  color: #64748b;
}

.rate-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.foot {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.gst-toggle {
  align-self: center;
}

.other-charges {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fbfdff;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.section-head h3 {
  margin: 0;
  font-size: 16px;
}

.charges-grid {
  display: grid;
  gap: 8px;
}

.charge-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 140px auto;
  gap: 8px;
  align-items: center;
}

.charge-head {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.charges-empty {
  margin: 0;
}

.replacement {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.replacement-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.replacement-body {
  margin-top: 12px;
  display: grid;
  gap: 12px;
}

.replacement-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.replacement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.replacement-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  font-weight: 600;
}

.panel {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 320px;
  background: #fff;
  box-shadow: 0 0 22px rgba(15, 23, 42, 0.2);
  z-index: 980;
  padding: 14px;
  transition: transform 0.25s ease;
}

.panel.left {
  left: var(--app-sidebar-width, 280px);
  transform: translateX(-110%);
}

.panel.right {
  right: 0;
  transform: translateX(110%);
}

.panel.open.left,
.panel.open.right {
  transform: translateX(0);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.list {
  margin-top: 12px;
  display: grid;
  gap: 8px;
  max-height: 80vh;
  overflow: auto;
}

.list button {
  text-align: left;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 9px;
  border-radius: 8px;
  width: 100%;
}

.list button:hover,
.icon:hover {
  background: #eef2ff;
}

.modal-wrap {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(2, 6, 23, 0.45);
  z-index: 1200;
}

.quick-create-modal {
  background: #fff;
  border-radius: 10px;
  display: grid;
  gap: 12px;
  max-width: 460px;
  padding: 18px;
  width: 100%;
}

.modal-actions,
.quick-row {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.quick-row input {
  flex: 1;
}

.overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: var(--app-sidebar-width, 280px);
  background: rgba(2, 6, 23, 0.45);
  z-index: 970;
}

@media (max-width: 960px) {
  .panel.left {
    left: 0;
  }

  .modal-wrap {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(2, 6, 23, 0.45);
  z-index: 1200;
}

.quick-create-modal {
  background: #fff;
  border-radius: 10px;
  display: grid;
  gap: 12px;
  max-width: 460px;
  padding: 18px;
  width: 100%;
}

.modal-actions,
.quick-row {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.quick-row input {
  flex: 1;
}

.overlay {
    left: 0;
  }
}

@media (max-width: 720px) {
  input[type="number"] {
    width: 90px;
  }

  .charge-row {
    grid-template-columns: 1fr;
  }

  .panel {
    width: 86%;
  }
}
</style>
