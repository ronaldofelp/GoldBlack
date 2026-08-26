import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EntityPageLayout } from './EntityPageLayout';

describe('EntityPageLayout', () => {
  const mockColumns = [
    { key: 'name', label: 'Nome' },
    { key: 'value', label: 'Valor' },
  ];

  const mockData = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
  ];

  const renderRow = (item: any, index: number) => (
    <tr key={item.id} data-testid={`row-${item.id}`}>
      <td>{item.name}</td>
      <td>{item.value}</td>
    </tr>
  );

  it('renders title and description', () => {
    render(
      <EntityPageLayout
        title="Test Title"
        description="Test Description"
        columns={mockColumns}
        data={mockData}
        renderRow={renderRow}
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders columns correctly', () => {
    render(
      <EntityPageLayout
        title="Test"
        description="Test"
        columns={mockColumns}
        data={mockData}
        renderRow={renderRow}
      />
    );
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
  });

  it('renders data rows correctly', () => {
    render(
      <EntityPageLayout
        title="Test"
        description="Test"
        columns={mockColumns}
        data={mockData}
        renderRow={renderRow}
      />
    );
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('renders loading state when data is empty and loading is true', () => {
    render(
      <EntityPageLayout
        title="Test"
        description="Test"
        columns={mockColumns}
        data={[]}
        loading={true}
        renderRow={renderRow}
      />
    );
    expect(screen.getByText('Carregando dados...')).toBeInTheDocument();
  });

  it('renders empty state when data is empty and not loading', () => {
    render(
      <EntityPageLayout
        title="Test"
        description="Test"
        columns={mockColumns}
        data={[]}
        loading={false}
        renderRow={renderRow}
      />
    );
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
  });

  it('renders error message when error is provided', () => {
    render(
      <EntityPageLayout
        title="Test"
        description="Test"
        columns={mockColumns}
        data={[]}
        error="Network failed"
        renderRow={renderRow}
      />
    );
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Network failed')).toBeInTheDocument();
  });
});
