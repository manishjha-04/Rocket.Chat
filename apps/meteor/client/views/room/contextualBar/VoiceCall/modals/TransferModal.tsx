import { Button, Field, FieldHint, FieldLabel, FieldRow, Modal } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import UserAutoComplete from '../../../../../components/UserAutoComplete';

type VoiceCallTransferModalProps = {
	extension: string;
	isLoading?: boolean;
	onCancel(): void;
	onConfirm(params: { extension: string; name: string | undefined }): void;
};

export const VoiceCallTransferModal = ({ extension, isLoading = false, onCancel, onConfirm }: VoiceCallTransferModalProps) => {
	const { t } = useTranslation();
	const [username, setTransferTo] = useState('');
	const user = useUser();
	const transferToId = useUniqueId();
	const modalId = useUniqueId();

	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const { data: targetUser, isInitialLoading: isTargetInfoLoading } = useQuery(
		['/v1/users.info', username],
		() => getUserInfo({ username }),
		{
			enabled: Boolean(username),
			select: (data) => data?.user || {},
		},
	);

	const handleConfirm = () => {
		if (!targetUser?.freeSwitchExtension) {
			return;
		}

		onConfirm({ extension: targetUser.freeSwitchExtension, name: targetUser.name });
	};

	return (
		<Modal open aria-labelledby={modalId}>
			<Modal.Header>
				<Modal.Icon color='danger' name='modal-warning' />
				<Modal.Title id={modalId}>{t('Transfer_call')}</Modal.Title>
				<Modal.Close aria-label={t('Close')} onClick={onCancel} />
			</Modal.Header>
			<Modal.Content>
				<Field>
					<FieldLabel htmlFor={transferToId}>{t('Transfer_to')}</FieldLabel>
					<FieldRow>
						<UserAutoComplete
							id={transferToId}
							value={username}
							aria-describedby={`${transferToId}-hint`}
							data-testid='vc-input-transfer-to'
							onChange={(target) => setTransferTo(target as string)}
							multiple={false}
							conditions={{
								freeSwitchExtension: { $exists: true, $ne: extension },
								username: { $ne: user?.username },
							}}
						/>
					</FieldRow>
					<FieldHint id={`${transferToId}-hint`}>{t('Select_someone_to_transfer_the_call_to')}</FieldHint>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button data-testid='vc-button-cancel' secondary onClick={onCancel}>
						{t('Cancel')}
					</Button>
					<Button
						danger
						onClick={handleConfirm}
						disabled={!targetUser?.freeSwitchExtension}
						loading={isLoading || isTargetInfoLoading}
						data-testid='vc-button-transfer'
					>
						{t('Hang_up_and_transfer_call')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default VoiceCallTransferModal;
