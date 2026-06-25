import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Radio, Space, Divider, Typography, Row, Col, Alert } from 'antd';
import type { FormInstance } from 'antd';

const { Text, Title } = Typography;

interface CreateProductModalProps {
    open: boolean;
    onClose: () => void;
}

export default function CreateProductModal({ open, onClose }: CreateProductModalProps) {
    const [form] = Form.useForm();
    const [mode, setMode] = useState<'unidade' | 'lote'>('unidade');

    const watchBaseName = Form.useWatch('lote_baseName', form);
    const watchMetal = Form.useWatch('lote_metal', form);
    const watchStone = Form.useWatch('lote_stone', form);
    const watchAdjustable = Form.useWatch('lote_adjustable', form);
    const watchColor = Form.useWatch('lote_color', form);

    const categoryOptions = [
        { value: 'Brincos', label: 'Brincos' }, { value: 'Aneis', label: 'Anéis' },
        { value: 'Braceletes', label: 'Braceletes' }, { value: 'Chokers', label: 'Chokers' },
        { value: 'Conjuntos', label: 'Conjuntos' }, { value: 'Pingentes', label: 'Pingentes' },
        { value: 'Chaveiros', label: 'Chaveiros' }, { value: 'Decoração', label: 'Decoração' },
        { value: 'Pulseiras', label: 'Pulseiras' }, { value: 'Geral', label: 'Geral' },
    ];

    useEffect(() => {
        if (!open) {
            form.resetFields();
            setMode('unidade');
        }
    }, [open, form]);

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            console.log('Valores do formulário:', { mode, ...values });
            // onClose();
        }).catch((info) => {
            console.log('Falha na validação:', info);
        });
    };

    const generatedBatchName = [
        watchBaseName || '[Nome]',
        watchMetal || '[Metal]',
        watchStone || '[Pedra]',
        watchAdjustable ? (watchAdjustable === 'Sim' ? 'Regulável' : 'Fixo') : '[Ajuste]',
        watchColor || '[Cor]'
    ].join(' - ');

    return (
        <Modal
            title={<Title level={4} style={{ margin: 0 }}>Criar Produto (Nuvemshop)</Title>}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Salvar Produto(s)"
            cancelText="Cancelar"
            width={700}
            destroyOnClose
        >
            <div className="mb-6 mt-4 flex justify-center">
                <Radio.Group
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    buttonStyle="solid"
                    size="large"
                >
                    <Radio.Button value="unidade" style={{ width: 150, textAlign: 'center' }}>Unidade (Única)</Radio.Button>
                    <Radio.Button value="lote" style={{ width: 150, textAlign: 'center' }}>Lote (Grade)</Radio.Button>
                </Radio.Group>
            </div>

            <Form form={form} layout="vertical" initialValues={{ lote_adjustable: 'Não' }}>

                {/* ─── ABA 1: UNIDADE ÚNICA ────────────────────────────────────────── */}
                {mode === 'unidade' && (
                    <div className="animate-fade-in">
                        <Alert message="Criação de produto simples. Uma única variação será sincronizada com a Nuvemshop." type="info" showIcon className="mb-4" />

                        <Row gutter={16}>
                            <Col span={16}>
                                <Form.Item name="name" label="Nome do Produto" rules={[{ required: true, message: 'Digite o nome!' }]}>
                                    <Input placeholder="Ex: Anel Solitário Ouro 18k" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="category" label="Categoria" rules={[{ required: true }]}>
                                    <Select placeholder="Selecione..." options={categoryOptions} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="sku" label="SKU Base" rules={[{ required: true }]}>
                                    <Input placeholder="Ex: AN-SOL-01" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="price" label="Preço de Venda (R$)" rules={[{ required: true }]}>
                                    <InputNumber style={{ width: '100%' }} prefix="R$" min={0} step={0.01} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="stock" label="Estoque Físico" rules={[{ required: true }]}>
                                    <InputNumber style={{ width: '100%' }} min={0} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* ─── ABA 2: LOTE (BATCH CREATION) ────────────────────────────────── */}
                {mode === 'lote' && (
                    <div className="animate-fade-in">
                        <Alert
                            message="Modo Lote Ativado: O sistema montará o nome das variações automaticamente e criará os itens em massa na Nuvemshop."
                            type="warning"
                            showIcon
                            className="mb-4"
                        />

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="category" label="Categoria" rules={[{ required: true }]}>
                                    <Select placeholder="Selecione..." options={categoryOptions} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="batchQuantity" label="Quantidade (Estoque para cada)" rules={[{ required: true }]}>
                                    <InputNumber style={{ width: '100%' }} min={1} placeholder="Quantas peças?" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" plain>Montagem do Lote</Divider>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="lote_baseName" label="Nome Base" rules={[{ required: true }]}>
                                    <Input placeholder="Ex: Anel Cravejado" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="lote_metal" label="Tipo de Metal" rules={[{ required: true }]}>
                                    <Select options={[
                                        { value: 'Prata 925', label: 'Prata 925' },
                                        { value: 'Banhado a Ouro', label: 'Banhado a Ouro' },
                                        { value: 'Banhado a Ródio', label: 'Banhado a Ródio' },
                                        { value: 'Aço', label: 'Aço Inoxidável' },
                                    ]} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="lote_stone" label="Pedra" rules={[{ required: true }]}>
                                    <Select options={[
                                        { value: 'Zircônia', label: 'Zircônia' },
                                        { value: 'Esmeralda', label: 'Esmeralda' },
                                        { value: 'Pérola', label: 'Pérola' },
                                        { value: 'Sem Pedra', label: 'Sem Pedra' },
                                    ]} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="lote_adjustable" label="Regulável?" rules={[{ required: true }]}>
                                    <Radio.Group>
                                        <Radio value="Sim">Sim (Regulável)</Radio>
                                        <Radio value="Não">Não (Fixo)</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="lote_color" label="Cor/Banho" rules={[{ required: true }]}>
                                    <Select options={[
                                        { value: 'Dourado', label: 'Dourado' },
                                        { value: 'Prateado', label: 'Prateado' },
                                        { value: 'Ouro Rosé', label: 'Ouro Rosé' },
                                    ]} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-md mt-2">
                            <Text type="secondary" className="block mb-1 text-xs uppercase tracking-wider">Preview do Nome Gerado:</Text>
                            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                                {generatedBatchName}
                            </Text>
                        </div>
                    </div>
                )}
            </Form>
        </Modal>
    );
}