import { Modal, Form, Input, Select, InputNumber, Row, Col, message } from 'antd';
import { productsApi } from '@/services/api';

interface CreateProductModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const categoryOptions = [
    { value: 'Brincos', label: 'Brincos' }, { value: 'Aneis', label: 'Anéis' },
    { value: 'Braceletes', label: 'Braceletes' }, { value: 'Chokers', label: 'Chokers' },
    { value: 'Conjuntos', label: 'Conjuntos' }, { value: 'Pingentes', label: 'Pingentes' },
    { value: 'Chaveiros', label: 'Chaveiros' }, { value: 'Decoração', label: 'Decoração' },
    { value: 'Pulseiras', label: 'Pulseiras' }, { value: 'Geral', label: 'Geral' },
];

export default function CreateProductModal({ open, onClose, onSuccess }: CreateProductModalProps) {
    const [form] = Form.useForm();

    const handleSubmit = () => {
        form.validateFields().then(async (values) => {
            try {
                await productsApi.create({
                    slug: values.slug,
                    name: values.name,
                    category: values.category,
                    is_active: true,
                    variants: [{
                        sku: values.sku,
                        name: 'Padrão',
                        price: values.price,
                        stock_quantity: values.stock_quantity,
                        cost_price: values.cost_price,
                        packaging_cost: values.packaging_cost,
                        platform_fee_percent: values.platform_fee_percent,
                        fixed_fee: values.fixed_fee,
                    }],
                });
                message.success('Produto criado com sucesso!');
                onSuccess();
                onClose();
            } catch (err: unknown) {
                const error = err as { response?: { data?: { error?: string } }; message?: string };
                message.error(error?.response?.data?.error || error?.message || 'Erro ao criar produto');
            }
        }).catch((info) => {
            console.log('Falha na validação:', info);
        });
    };

    return (
        <Modal
            title="Criar Produto"
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Salvar Produto"
            cancelText="Cancelar"
            width={700}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="name" label="Nome do Produto" rules={[{ required: true, message: 'Digite o nome!' }]}>
                            <Input placeholder="Ex: Anel Solitário Ouro 18k" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="slug" label="Slug" rules={[{ required: true, message: 'Digite o slug!' }]}>
                            <Input placeholder="Ex: anel-solitario-ouro-18k" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="category" label="Categoria" rules={[{ required: true }]}>
                            <Select placeholder="Selecione..." options={categoryOptions} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Digite o SKU!' }]}>
                            <Input placeholder="Ex: AN-SOL-01" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="price" label="Preço de Venda (R$)" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} prefix="R$" min={0} step={0.01} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="stock_quantity" label="Estoque" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="cost_price" label="Preço de Custo (R$)" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} prefix="R$" min={0} step={0.01} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="packaging_cost" label="Custo de Embalagem (R$)" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} prefix="R$" min={0} step={0.01} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="platform_fee_percent" label="Taxa da Plataforma (%)" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.01} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="fixed_fee" label="Taxa Fixa (R$)" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} prefix="R$" min={0} step={0.01} />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
