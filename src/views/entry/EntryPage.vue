<template>
  <div class="entry-page">
    <div class="page-head">
      <h2>Entry</h2>
      <div class="head-right">
        <label class="field-inline">
          <span>Bill Number</span>
          <input
            v-model.trim="billNumber"
            :disabled="isAutoBillNumber"
            :readonly="isAutoBillNumber"
            :placeholder="isAutoBillNumber ? 'Auto generated' : 'Enter bill number'"
          />
        </label>
        <label class="field-inline">
          <span>Date</span>
          <input type="date" v-model="invoiceDate" />
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
      <button class="btn btn-primary" @click="leftOpen = true">Select Party</button>
      <button class="btn btn-secondary" @click="rightOpen = true">Select Product</button>
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
            <td>{{ row.availableStock ?? '-' }}</td>
            <td>
              <input
                type="number"
                min="0"
                :max="isReturn ? row.maxQty : undefined"
                v-model.number="row.quantity"
                @input="updateRowFromRate(row)"
              />
            </td>
            <td>
              <input type="number" min="0" v-model.number="row.rate" :readonly="isReturn" @input="updateRowFromRate(row)" />
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
                v-model.number="row.totalAmount"
                @input="updateRowFromTotal(row)"
              />
              <span v-else>{{ money(row.totalAmount) }}</span>
            </td>
            <td>
              <button v-if="isSaleOrPurchase" class="btn btn-danger" @click="removeRow(idx)">Remove</button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7" class="empty">No products selected</td>
          </tr>
        </tbody>
      </table>
    </div>

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
      <span v-if="isSaleOrPurchase">Subtotal: {{ money(subtotalAmount) }}</span>
      <label v-if="isSaleOrPurchase && gstEnabled" class="field-inline compact tax-field">
        <span>GST / Tax</span>
        <input type="number" min="0" :step="decimalStep" v-model.number="taxAmount" />
      </label>
      <label v-if="isSaleOrPurchase && paymentType === 'credit'" class="field-inline compact tax-field">
        <span>Paid Amount</span>
        <input type="number" min="0" :step="decimalStep" v-model.number="paidAmount" />
      </label>
      <strong>Total Bill Amount: {{ money(totalAmount) }}</strong>
      <button class="btn btn-success" @click="save">{{ isEditMode ? "Update" : "Save" }}</button>
    </div>

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
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { getUsersApi } from "@/api/userApi";
import { hasUserRole } from "@/utils/userRole";
import { useCurrency } from "@/composables/useCurrency";
import { useCompanySettings } from "@/composables/useCompanySettings";
import { notifySuccess, notifyWarning } from "@/utils/notifications";
import Loader from "@/components/Loader.vue";

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
const paymentType = ref("credit");
const bankAccountId = ref("");
const paidAmount = ref(0);
const taxAmount = ref(0);
const invoiceDate = ref(new Date().toISOString().slice(0, 10));
const billNumber = ref("");
const loading = ref(false);
const showCost = ref(false);

const returnBills = ref([]);
const selectedReturnBillId = ref("");
const bankAccounts = ref([]);
const createReplacement = ref(false);
const replacementRows = ref([]);
const replacementPaymentType = ref("credit");
const replacementBankAccountId = ref("");
const replacementPaidAmount = ref(0);
const replacementInvoiceNo = ref("");

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
    .filter((p) => (p.name || "").toLowerCase().includes(q));
});

const filteredProducts = computed(() => {
  const q = productSearch.value.toLowerCase();
  return products.value.filter((p) => (p.name || "").toLowerCase().includes(q));
});

const subtotalAmount = computed(() =>
  roundCurrency(rows.value.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)),
);
const totalAmount = computed(() =>
  roundCurrency(subtotalAmount.value + (isSaleOrPurchase.value && gstEnabled.value ? Number(taxAmount.value || 0) : 0)),
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

const selectParty = (party) => {
  selectedParty.value = party;
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
    quantity: 1,
    rate: lastRate ?? 0,
    totalAmount: roundCurrency(lastRate ?? 0),
    lastRate,
    availableStock: stockRes.data.stock ?? 0,
  });
  rightOpen.value = false;
};

const removeRow = (idx) => rows.value.splice(idx, 1);
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
    const res = await http.get("/sales");
    billNumber.value = `SAL-${(res.data || []).length + 1}`;
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
  invoiceDate.value = new Date().toISOString().slice(0, 10);

  rows.value = (res.data.items || [])
    .filter((item) => item.remainingQty > 0)
    .map((item) => ({
      productId: item.productId,
      productName: item.productName,
      availableStock: item.remainingQty,
      maxQty: item.remainingQty,
      quantity: 0,
      rate: item.rate,
      totalAmount: roundCurrency(0),
    }));
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
  taxAmount.value = gstEnabled.value ? Number(data.tax || 0) : 0;
  invoiceDate.value = data.invoiceDate ? new Date(data.invoiceDate).toISOString().slice(0, 10) : invoiceDate.value;
  billNumber.value = data.invoiceNo || "";

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
  paidAmount.value = 0;
  taxAmount.value = 0;
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
    return false;
  }
  return true;
};

const save = async () => {
  if (!rows.value.length) {
    notifyWarning("Please add at least one product");
    return;
  }

  if (!isAutoBillNumber.value && !validateBillNumber()) {
    return;
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
      partyId: selectedParty.value?._id || null,
      paymentType: paymentType.value,
      bankAccountId: paymentType.value === "bank" ? bankAccountId.value : null,
      invoiceDate: invoiceDate.value,
      items: rows.value.map((r) => ({ productId: r.productId, quantity: r.quantity, rate: roundCurrency(r.rate) })),
      tax: gstEnabled.value ? Number(taxAmount.value || 0) : 0,
      paidAmount: paymentType.value === "credit" ? Number(paidAmount.value || 0) : Number(totalAmount.value || 0),
    };
    if (isEditMode.value) {
      await http.put(`/sales/${route.params.id}`, payload);
    } else {
      await http.post("/sales", payload);
    }
    notifySuccess(isEditMode.value ? "Sale updated successfully." : "Sale saved successfully.");
    router.push("/sales");
    return;
  }

  if (transactionType.value === "purchase") {
    const payload = {
      partyId: selectedParty.value?._id || null,
      paymentType: paymentType.value,
      bankAccountId: paymentType.value === "bank" ? bankAccountId.value : null,
      invoiceNo: billNumber.value.trim(),
      invoiceDate: invoiceDate.value,
      items: rows.value.map((r) => ({ productId: r.productId, quantity: r.quantity, rate: roundCurrency(r.rate) })),
      tax: gstEnabled.value ? Number(taxAmount.value || 0) : 0,
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
  const [productRes, partyRes, bankRes] = await Promise.all([http.get("/products"), getUsersApi(), http.get("/bank-accounts")]);
  products.value = productRes.data || [];
  parties.value = partyRes.data || [];
  bankAccounts.value = bankRes.data || [];
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

  .overlay {
    left: 0;
  }
}

@media (max-width: 720px) {
  input[type="number"] {
    width: 90px;
  }

  .panel {
    width: 86%;
  }
}
</style>

